import { ClusterManager, ICluster, IClustherAuthCertificate } from "./cluster-manager";
import axios, { AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { readFile } from 'fs/promises';
import AuthProvider, { ISfAadMetadata } from "./aad";
import { ClusterStateError } from "./constants";

export type SslVersion =
    "TLS" | "TLS1.2" | "TLS1.1" | "TLS1.0" | "SSL3.0";

export type HttpMethod =
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE" |
    "HEAD" | "OPTIONS";

export interface IHttpHeader {
    name: string;
    value: string;
}

export interface IHttpResponse {
    statusCode: number;
    statusMessage: string;

    data: any;

    headers: Record<string, string>;
}

export interface IHttpRequest {
    method: HttpMethod;
    url: string;
    headers?: Array<IHttpHeader>;
    body?: any;
}

export interface IHttpPipeline {
    requestTemplate: IHttpRequest;
    requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
}

export class httpHandler {

    public failiedToInitialize: boolean = true;
    private httpsAgent: Agent;
    private aadProvider: AuthProvider;

    constructor(private cluster: ICluster, private clusterManager: ClusterManager) {

    }

    public async initialize() {
        try {
            if (this.cluster.authType.authType === "certificate") {
                this.initializeCertificateConnection();
            } else if (this.cluster.authType.authType === "aad") {
                await this.fetchAndSetAADConfiguration();
            }
        } catch (e) {
            this.clusterManager.updateClusterData(this.cluster.id, {
                message: `There was an issue connecting to this cluster: ${e.toString()}`,
                state: ClusterStateError
            })
        }

        await this.testConnection();
    }

    private async initializeCertificateConnection() {
        const auth = this.cluster.authType as IClustherAuthCertificate;

        let cert;

        try {
            cert = await readFile(auth.certificatePath);

            this.httpsAgent = new Agent({
                rejectUnauthorized: false,
                pfx: cert,
                passphrase: '' //TODO Pass this down
            })

        } catch (e) {
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load certificate.")
        }
    }

    /*
    Tests if the cluster is reachable by querying for the health state
    */
    private async testConnection() {
        try {
            const health = await this.requestAsync({
                method: 'GET',
                url: '/$/GetClusterHealthChunk?api-version=3.0'
            })
        } catch (e) {
            if (e.toString().includes("connect ECONNREFUSED")) {
                this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load cluster health. This could mean the cluster is not reachable.")
            } else {
                this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load cluster health.")
            }
        }
    }

    private async fetchAndSetAADConfiguration() {
        this.clusterManager.addClusterLogMessage(this.cluster.id, "Fetching AAD configuration")

        try {
            const url = `${this.cluster.url}/$/GetAadMetadata?api-version=1.0`;
            const res = await axios.get<ISfAadMetadata>(url, {
                httpsAgent: new Agent({
                    rejectUnauthorized: false
                })
            });

            this.aadProvider = new AuthProvider({
                auth: {
                    clientId: res.data.metadata.cluster,
                    authority: res.data.metadata.authority,
                }
            })

        } catch (e) {
            this.failiedToInitialize = true;
            this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to initialize AAD configuration. This could mean the cluster is not reachable.")
        }
        this.failiedToInitialize = false;
    }

    public async requestAsync(request: IHttpRequest): Promise<IHttpResponse> {
        const headers: Record<string, string> = {};

        if (request.headers) {
            request.headers.forEach(header => {
                headers[header.name] = header.value;
            })
        }

        let config: AxiosRequestConfig = {
            method: request.method,
            url: `${this.cluster.url}/${request.url}`,
            data: request.body,
            headers,
            validateStatus: function () {
                return true; // pass through all errors as expected, let SFX handle 400/500s
            }
        }

        if (this.httpsAgent) {
            config.httpsAgent = this.httpsAgent;
        } else if (this.cluster.url.startsWith("https://")) {
            config.httpAgent = new Agent({
                rejectUnauthorized: false
            });
        }

        if (this.cluster.authType.authType === "aad") {
            const tokenRequest = {
                scopes: ['User.Read'],
            };
            const token = await this.aadProvider.getToken(tokenRequest);
            headers['Authorization'] = 'Bearer ' + token
        }

        const res = await axios.request(config);

        return {
            statusCode: res.status,
            statusMessage: res.statusText,
            data: res.data,
            headers: res.headers,
        }
    }
}