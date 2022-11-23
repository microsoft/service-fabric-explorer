import { PublicClientApplication, LogLevel, CryptoProvider, AuthorizationCodeRequest, Configuration, SilentFlowRequest, AuthenticationResult, AccountInfo, AuthorizationUrlRequest } from '@azure/msal-node';
import axios, { AxiosRequestConfig } from 'axios';
import { BrowserWindow } from 'electron';
import { Agent } from 'https';
import { ClusterManager, ICluster } from '../cluster-manager';
import { aadClusterAuthType } from '../constants';
import { BaseHttpHandler, IAuthOption, IHTTPRequestTransformer } from '../httpHandler';
import { cachePlugin } from './CachePlugin';
import { CustomFileProtocolListener } from './customFileProtocol';
import { ValidateProperty } from '../mainWindow/validate';
import { Subject } from 'rxjs';

export default class AuthProvider2 {
    activeTokenRquest: Promise<string>;

    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authCodeUrlParams: AuthorizationUrlRequest;
    private authCodeRequest: AuthorizationCodeRequest;
    constructor(private metaData: ISfAadMetadata) {

        const MSAL_CONFIG: Configuration = {
                auth: {
                    clientId: metaData.metadata.cluster,
                    authority: metaData.metadata.authority
                },
                cache: {
                    cachePlugin: cachePlugin(metaData.metadata.cluster)
                },
                system: {
                    loggerOptions: {
                        loggerCallback(loglevel, message, containsPii) {
                            console.log(message);
                        },
                        piiLoggingEnabled: false,
                        logLevel: LogLevel.Info,
                    }
                }
            };

        this.clientApplication = new PublicClientApplication(MSAL_CONFIG);
        this.account = null;
        this.setRequestObjects();
    }

    public get currentAccount(): AccountInfo {
        return this.account;
    }

    /**
     * Initialize request objects used by this AuthModule.
     */
    private setRequestObjects(): void {
        const redirect = "msal://redirect";

        this.authCodeUrlParams = {
            "scopes": ["user.read", ],
            "redirectUri": redirect
        },

        this.authCodeRequest = {
            "redirectUri": redirect,
            "scopes": ["User.Read"],
            code: null
        };

    }

    // Creates a  "popup" window for interactive authentication
    private static createAuthWindow(): BrowserWindow {
        return new BrowserWindow({
            width: 400,
            height: 600
        });
    }

    async getToken(): Promise<string> {
        const request: SilentFlowRequest = {
            account: null, 
            forceRefresh: false,
            scopes: [`${this.metaData.metadata.cluster}/.default`]
        };

        let resolve: (value: string) => void;

        if(this.activeTokenRquest) {
            return this.activeTokenRquest;
        }else{
            this.activeTokenRquest = new Promise((r) => {
                resolve = r;
            });
        }
        let authResponse: AuthenticationResult;
        const account = this.account || await this.getAccount();

        if (account) {
            request.account = account;
            authResponse = await this.getTokenSilent(request);
        } else {
            const authCodeRequest = {...this.authCodeUrlParams, ...request };
            authResponse = await this.getTokenInteractive(authCodeRequest);
        }

        resolve(authResponse.accessToken || null);
        this.activeTokenRquest = null;

        return authResponse.accessToken || null;
    }

    async getTokenSilent(tokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        try {
            const result = await this.clientApplication.acquireTokenSilent(tokenRequest);
            this.handleResponse(result)
            return result;
        } catch (error) {
            console.log("Silent token acquisition failed, acquiring token using pop up");
            const authCodeRequest = {...this.authCodeUrlParams, ...tokenRequest };
            const result = await this.getTokenInteractive(authCodeRequest);
            this.handleResponse(result)
            return result
        }
    }

    async getTokenInteractive(tokenRequest: AuthorizationUrlRequest): Promise<AuthenticationResult> {
        // Generate PKCE Challenge and Verifier before request
        const cryptoProvider = new CryptoProvider();
        const { challenge, verifier } = await cryptoProvider.generatePkceCodes();
        const authWindow = AuthProvider2.createAuthWindow();

        // Add PKCE params to Auth Code URL request
        const authCodeUrlParams = { 
            ...this.authCodeUrlParams,
            scopes: tokenRequest.scopes,
            codeChallenge: challenge,
            codeChallengeMethod: "S256" 
        };

        try {
            // Get Auth Code URL
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);
            const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);

            // Use Authorization Code and PKCE Code verifier to make token request
            const authResult: AuthenticationResult = await this.clientApplication.acquireTokenByCode({
                ...this.authCodeRequest,
                code: authCode,
                codeVerifier: verifier
            });
            
            authWindow.close();
            return authResult;
        } catch (error) {
            console.log(error)
            authWindow.close();
            throw error;
        }
    }

    async login(): Promise<AccountInfo> {
        const authResult = await this.getTokenInteractive(this.authCodeUrlParams);
        return this.handleResponse(authResult);
    }

    async loginSilent(): Promise<AccountInfo> {
        if (!this.account) {
            this.account = await this.getAccount();
        }
        return this.account;
    }

    async logout(): Promise<void> {
        const account = await this.getAccount();
        if (account) {
            await this.clientApplication.getTokenCache().removeAccount(account);
            this.account = null;
        }
    }

    private async listenForAuthCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        // Set up custom file protocol to listen for redirect response
        const authCodeListener = new CustomFileProtocolListener('msal'); //`msal${this.metaData.metadata.cluster}`
        const codePromise = authCodeListener.start();
        authWindow.loadURL(navigateUrl);
        const code = await codePromise;
        authCodeListener.close();
        return code;
    }

    /**
     * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response 
     */
    private async handleResponse(response: AuthenticationResult) {
        if (response !== null) {
            this.account = response.account;
        } else {
            this.account = await this.getAccount();
        }
        return this.account;
    }

    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.     * 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    public async getAccount(): Promise<AccountInfo> {
        const cache = this.clientApplication.getTokenCache();

        const currentAccounts = await cache.getAllAccounts();
        if (currentAccounts === null) {
            console.log("No accounts detected");
            return null;
        }

        if (currentAccounts.length > 1) {
            // Add choose account code here
            console.log("Multiple accounts detected, need to add choose account code.");
            return currentAccounts[0];
        } else if (currentAccounts.length === 1) {
            return currentAccounts[0];
        } else {
            console.log("no account")
            return null;
        }
    }
}
export interface ISfAadMetadata {
    type: string;
    metadata: {
        authority: string;
        client: string;
        cluster: string;
        login: string;
        redirect: string;
        tenant: string;
    };
}

export interface ILoggedInAccounts {
    account: AccountInfo;
    tenant: string;
}

export class AADFactory implements IAuthOption {
        id = aadClusterAuthType;
        displayName = "AAD";
        validators: ValidateProperty[] = [];

        public observable = new Subject<ILoggedInAccounts[]>();
        private existingAuthProviders: Record<string, AuthProvider2> = {};

        constructor(private clusterManager: ClusterManager) {

        }

        async emitAccountsAndTenants() {
            const data = await this.getAadAccountsAndTenants();
            this.observable.next(data);
        }

        async getAadAccountsAndTenants(): Promise<ILoggedInAccounts[]> {
            const accounts = await Promise.all(Object.keys(this.existingAuthProviders).map(key => this.existingAuthProviders[key]).map(authProvider => {
                return authProvider.getAccount()
            }));

            return accounts.filter(account => account).map(account => {
                return {
                    tenant: account?.tenantId,
                    account
                }
            })
        }

        getHandler() {
            return new AADHttpHandler(this.clusterManager, this);
        }

        async getAuthProvider(metaData: ISfAadMetadata) {
            if(metaData.metadata.tenant in this.existingAuthProviders) {
                return this.existingAuthProviders[metaData.metadata.tenant];
            }

            const newProvider = new AuthProvider2(metaData);
            this.existingAuthProviders[metaData.metadata.tenant] = newProvider;
            this.emitAccountsAndTenants();

            return newProvider;
        }

        async logout(tenant: string) {
            if(tenant in this.existingAuthProviders) {
                await this.existingAuthProviders[tenant].logout();
                this.existingAuthProviders[tenant] = null;
                delete this.existingAuthProviders[tenant];

                this.emitAccountsAndTenants();
            }
        }
}


export class AADHttpHandler extends BaseHttpHandler {
    type: string = aadClusterAuthType;
    private metaData: ISfAadMetadata;
    private aadProvider: AuthProvider2;
    private caCerts: Buffer[] = null;
    protected httpsAgent: Agent;

    constructor(clusterManager: ClusterManager, private AADFactory: AADFactory) {
        super(clusterManager);
    }

    async initialize(cluster: ICluster) {
        this.cluster = cluster;
        let succesful = true;

        try {
            if(this.cluster.authentication.verifyConnection) {
                this.caCerts = await this.loadCAFolder();
            }

            this.httpsAgent = new Agent({
                ca: this.caCerts,
                rejectUnauthorized: this.cluster.authentication.verifyConnection
            })
        } catch(e) {
            succesful = false;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to CA Certificates : " + e)
            return succesful;
        }

        this.clusterManager.addClusterLogMessage(this.cluster.id, "Fetching AAD configuration")

        try {
            const url = `${this.cluster.url}/$/GetAadMetadata?api-version=1.0`;
            const res = await axios.get<ISfAadMetadata>(url, {
                httpsAgent: this.httpsAgent
            });

            this.metaData = res.data;
            this.aadProvider = await this.AADFactory.getAuthProvider(res.data);
            await this.aadProvider.getToken();

            this.AADFactory.emitAccountsAndTenants();
        } catch (e) {
            succesful = false;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to initialize AAD configuration. This could mean the cluster is not reachable.")
        }

        return succesful;
    }

    getMetaData() {
        return this.metaData;
    }

    async authenticateRequest(request: AxiosRequestConfig) {
        const token = await this.aadProvider.getToken();
        request.headers['Authorization'] = `Bearer ${token}`
        request.httpsAgent = this.httpsAgent;
        return request;
    }

}