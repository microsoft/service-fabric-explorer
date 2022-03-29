import { PublicClientApplication, LogLevel, CryptoProvider, AuthorizationCodeRequest, Configuration, SilentFlowRequest, AuthenticationResult } from '@azure/msal-node';
import axios, { AxiosRequestConfig } from 'axios';
import { Cluster } from 'cluster';
import { BrowserWindow, protocol } from 'electron';
import { Agent } from 'https';
import path from 'path';
import url from'url';
import { ClusterManager, ICluster } from '../cluster-manager';
import { aadClusterAuthType } from '../constants';
import { IAuthOption, IHTTPRequestTransformer } from '../httpHandler';
import { MainWindow } from '../mainWindow';
const CUSTOM_FILE_PROTOCOL_NAME = "msal904df931-49c6-404f-ad6c-4fd84a25d1bb";


/**
 * To demonstrate best security practices, this Electron sample application makes use of
 * a custom file protocol instead of a regular web (https://) redirect URI in order to
 * handle the redirection step of the authorization flow, as suggested in the OAuth2.0 specification for Native Apps.
 */

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

export default class AuthProvider {

    clientApplication;
    cryptoProvider;
    authCodeUrlParams: any;
    authCodeRequest: AuthorizationCodeRequest;
    pkceCodes: any;
    account: any;

    constructor(private metaData: ISfAadMetadata) {

        const MSAL_CONFIG: Configuration = {
                auth: {
                    clientId: metaData.metadata.cluster,
                    authority: metaData.metadata.authority
                },
                // cache: {
                //     cachePlugin
                // },
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

        // Initialize CryptoProvider instance
        this.cryptoProvider = new CryptoProvider();

        this.setRequestObjects();
    }

    /**
     * Initialize request objects used by this AuthModule.
     */
    //TODO SET THE REDIRECTURI correctly
    setRequestObjects() {
        const requestScopes = ['openid', 'profile', 'User.Read'];
        const redirectUri = "msal://redirect"; //`msal${this.metaData.metadata.cluster}://auth`

        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri: redirectUri
        };

        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri: redirectUri,
            code: null
        }

        this.pkceCodes = {
            challengeMethod: "S256", // Use SHA256 Algorithm
            verifier: "", // Generate a code verifier for the Auth Code Request first
            challenge: "" // Generate a code challenge from the previously generated code verifier
        };
    }

    async login() {
        const authResult = await this.getTokenInteractive(this.authCodeUrlParams);
        return this.handleResponse(authResult);
    }

    async logout() {
        if (this.account) {
            await this.clientApplication.getTokenCache().removeAccount(this.account);
            this.account = null;
        }
    }

    async getToken(request: SilentFlowRequest) {
        let authResponse;

        let account = this.account;
        if(!account) {
            account =  await this.getAccount();
        }

        console.log("acount" + JSON.stringify(account))
        if (account) {
            console.log("silent request")
            request.account = account;
            authResponse = await this.getTokenSilent(request);
        } else {
            console.log("token interactive")

            const authCodeRequest = {...this.authCodeUrlParams, ...request };
            authResponse = await this.getTokenInteractive(authCodeRequest);
        }

        return authResponse.accessToken || null;
    }

    async getTokenSilent(tokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        try {
            return await this.clientApplication.acquireTokenSilent(tokenRequest);
        } catch (error) {
            console.log("Silent token acquisition failed, acquiring token using pop up");
            const authCodeRequest = {...this.authCodeUrlParams, ...tokenRequest };
            return await this.getTokenInteractive(authCodeRequest);
        }
    }

    // This method contains an implementation of access token acquisition in authorization code flow
    async getTokenInteractive(tokenRequest: any) {
        const authWindow = new BrowserWindow({
            width: 400,
            height: 600
        });

        const {verifier, challenge} = await this.cryptoProvider.generatePkceCodes();

        this.pkceCodes.verifier = verifier;
        this.pkceCodes.challenge = challenge;

        const authCodeUrlParams = {
            ...this.authCodeUrlParams,
            scopes: tokenRequest.scopes,
            codeChallenge: this.pkceCodes.challenge, // PKCE Code Challenge
            codeChallengeMethod: this.pkceCodes.challengeMethod // PKCE Code Challenge Method
        };

        // Get Auth Code URL
        const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);

        const protocolUrl = 'msal' //`msal${this.metaData.metadata.cluster}`

        protocol.registerFileProtocol(protocolUrl, (req, callback) => {
            const requestUrl = url.parse(req.url, true);
            callback(path.normalize(`${__dirname}/${requestUrl.path}`));
        });

        const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);

        const authResponse = await this.clientApplication.acquireTokenByCode({
            ...this.authCodeRequest,
            scopes: tokenRequest.scopes,
            code: authCode,
            codeVerifier: this.pkceCodes.verifier // PKCE Code Verifier
        });

        authWindow.close();

        return authResponse;
    }

       private async listenForAuthCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        authWindow.loadURL(navigateUrl, {
            extraHeaders: `Content-Security-Policy: default-src 'self'`
        });

        return new Promise((resolve, reject) => {
            authWindow.webContents.on('will-redirect', (event, responseUrl) => {
                console.log("REDIRECTING WOOO")
                try {
                    const parsedUrl = new URL(responseUrl);
                    const authCode = parsedUrl.searchParams.get('code');
                    resolve(authCode);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response
     */
    async handleResponse(response: any) {
        if (response !== null) {
            this.account = response.account;
        } else {
            this.account = await this.getAccount();
        }

        return this.account;
    }

    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    async getAccount() {
        const cache = this.clientApplication.getTokenCache();
        const currentAccounts = await cache.getAllAccounts();

        if (currentAccounts === null) {
            console.log('No accounts detected');
            return null;
        }

        if (currentAccounts.length > 1) {
            // Add choose account code here
            console.log('Multiple accounts detected, need to add choose account code.');
            return currentAccounts[0];
        } else if (currentAccounts.length === 1) {
            return currentAccounts[0];
        } else {
            return null;
        }
    }
}

export class AADHandler implements IHTTPRequestTransformer {
    private aadProvider: AuthProvider;
    private cluster: ICluster;

    constructor(private clusterManager: ClusterManager, private AADFactory: AADFactory, private mainWindow: MainWindow) {

    }

    async initialize(cluster: ICluster) {
        this.cluster = cluster;
        let succesful = true;
        this.clusterManager.addClusterLogMessage(this.cluster.id, "Fetching AAD configuration")

        try {
            const url = `${this.cluster.url}/$/GetAadMetadata?api-version=1.0`;
            const res = await axios.get<ISfAadMetadata>(url, {
                httpsAgent: new Agent({
                    rejectUnauthorized: false
                })
            });

            this.aadProvider = this.AADFactory.getAuthProvider(res.data);

        } catch (e) {
            succesful = false;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to initialize AAD configuration. This could mean the cluster is not reachable.")
        }

        // await this.aadProvider.login(AADHandler.createAuthWindow());

        return succesful;
    }

    private static createAuthWindow(): BrowserWindow {
        return new BrowserWindow({
            width: 400,
            height: 600
        });
    }

    async transformRequest(request: AxiosRequestConfig) {
        const tokenRequest: any = {
            account: null, 
            forceRefresh: false,
            // scopes: ['User.Read'],
        };
        const token = await this.aadProvider.getTokenSilent(tokenRequest);
        // console.log(token)
        request.headers['Authorization'] = 'Bearer ' + token

        request.httpsAgent = new Agent({
            rejectUnauthorized: false
        })

        return request;
    }

}

export class AADFactory implements IAuthOption {
        id = aadClusterAuthType;
        displayName = "Secure";

        private existingAuthProviders: Record<string, AuthProvider> = {};

        constructor(private clusterManager: ClusterManager, private mainWindow: MainWindow) {

        }

        getHandler() { 
            return new AADHandler(this.clusterManager, this, this.mainWindow) 
        }

        getAuthProvider(metaData: ISfAadMetadata) {
            if(metaData.metadata.authority in this.existingAuthProviders) {
                return this.existingAuthProviders[metaData.metadata.authority];
            }
            console.log(metaData.metadata)
            const newProvider = new AuthProvider(metaData);

            this.existingAuthProviders[metaData.metadata.authority] = newProvider;

            return newProvider;
        }
}