import axios, { AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { aadClusterAuthType, secureClusterAuthType } from '../constants';
import { ClusterManager, ICluster, IClustherAuthCertificate } from '../cluster-manager';
import { BaseHttpHandler, IAuthOption } from '../httpHandler';
import { Logger } from '../logger';
import { NotificationTypes } from '../notificationManager';
import { randomUUID } from 'crypto';
import { URL, parse } from "url";
import { ISfAadMetadata } from './aad';
import { BrowserWindow } from 'electron';

//TODO clean up exact implementation 
function generateAuthzUrl(url: string, aadMetadata: ISfAadMetadata, authzEndpoint: string): string {
    const authzUrl = new URL(authzEndpoint);

    authzUrl.searchParams.set("client_id", aadMetadata.metadata.cluster);
    authzUrl.searchParams.set("response_type", "id_token");
    authzUrl.searchParams.set("redirect_uri", url);
    authzUrl.searchParams.set("response_mode", "fragment");
    authzUrl.searchParams.set("nonce", randomUUID());

    return authzUrl.href;
}

function acquireAuthzToken(url: string, aadMetadata: ISfAadMetadata, authzEndpoint: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const authzUrl = generateAuthzUrl(url, aadMetadata, authzEndpoint);

        const authzWnd = new BrowserWindow({
            title: `Azure Active Directory Authentication: ${parse(url).host}`,
            width: 800,
            height: 600,
            minimizable: false,
            maximizable: false
        });

        authzWnd.setMenuBarVisibility(true);
        authzWnd.webContents.openDevTools();

        authzWnd.webContents.on("did-navigate", (event, targetUrl) => {
            if (targetUrl.startsWith(url)) {
                authzWnd.hide();
                // console.log("UEL" + url);
                const token = new URL(targetUrl).hash.split("#id_token")[0];

                if (!token) {
                    reject(new Error("Invalid token received."));
                }
                authzWnd.destroy();
            }
        });

        authzWnd.webContents.on("did-fail-load",(event, _, __, url) => {
            const token = new URL(url).hash.split("#id_token=")[1].split("&session_state")[0];

            if (!token) {
                reject(new Error("Invalid token received."));
            }

            resolve(token);
            authzWnd.destroy();
        })
        try {
            authzWnd.loadURL(authzUrl);
            authzWnd.show();
        } catch(e) {
            reject(new Error("Invalid token received."));
            authzWnd.destroy();
        }

    });
}

function parseJwt (token: string) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

export function AadHandlerFactory(clusterManager: ClusterManager, logger: Logger): IAuthOption {
    return {
        id: aadClusterAuthType,
        displayName: "AAD",
        getHandler: () => new AADHttpHandler2(clusterManager, logger),
        validators: []
    }
}

export class AADHttpHandler2 extends BaseHttpHandler {
    protected httpsAgent: Agent;
    private metaData: ISfAadMetadata;
    private caCerts: Buffer[] = null;

    activeTokenRequest: Promise<string>;
    currentToken: string;

    constructor(clusterManager: ClusterManager, private logger: Logger) {
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
                rejectUnauthorized: !!this.cluster.authentication.verifyConnection
            })
        } catch(e) {
            succesful = false;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to CA Certificates : " + e)
            return succesful;
        }

        try {
            const url = `${this.cluster.url}/$/GetAadMetadata?api-version=1.0`;
            const res = await axios.get<ISfAadMetadata>(url, {
                httpsAgent: this.httpsAgent
            });

            this.metaData = res.data;

        } catch (e) {
            console.log(e);
            succesful = false;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to initialize AAD configuration. This could mean the cluster is not reachable.")
        }

        return succesful;
    }

    async getToken(): Promise<string> {
        if(this.currentToken) {
            const token = parseJwt(this.currentToken);
            let expiry = new Date();
            expiry.setUTCSeconds(token["exp"])
            if(expiry > new Date()) {
                return this.currentToken;
            }            
        }

        let resolve: (value: string) => void;

        if(this.activeTokenRequest) {
            return this.activeTokenRequest;
        }else{
            this.activeTokenRequest = new Promise((r) => {
                resolve = r;
            });
        }

        const openidConfigEndPoint: string =
        this.metaData.metadata.authority.endsWith("/") ? this.metaData.metadata.authority + ".well-known/openid-configuration" : this.metaData.metadata.authority + "/.well-known/openid-configuration";

        const adhocResponse = await axios.get(openidConfigEndPoint);
        const authzEndpoint = adhocResponse.data["authorization_endpoint"];
        const url = this.cluster.url + "/Explorer/index.html"
        const token = await acquireAuthzToken(url, this.metaData, authzEndpoint);

        if(token) {
            this.currentToken = token;
        }

        resolve(token || null);
        this.activeTokenRequest = null;
        return token || null;
    }

    protected async authenticateRequest(request: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        const token = await this.getToken();
        request.headers['Authorization'] = `Bearer ${token}`
        request.httpsAgent = this.httpsAgent;
        return request;
    }
}