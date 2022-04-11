import { ClusterManager, ICluster, IClustherAuthCertificate } from "./cluster-manager";
import axios, { AxiosRequestConfig } from 'axios';
import { ValidateProperty } from "./mainWindow/validate";

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

export interface IHTTPRequestTransformer {
    type: string;
    initialize: (cluster: ICluster) => Promise<boolean>;
    transformRequest: (request: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
}

export interface IAuthOption {
    id: string;
    displayName: string;
    getHandler: () => IHttpHandler;
    validators: ValidateProperty[]; 
}

export interface IHttpHandler {
    type: string;
    initialize: (cluster: ICluster) => Promise<boolean>;
    requestAsync(request: IHttpRequest, normalErrorResolution: boolean): Promise<IHttpResponse>;
    testConnection(): Promise<boolean>;
}

export class BaseHttpHandler implements IHttpHandler {
    type: string = "unsecure";

    protected cluster: ICluster;

    constructor(protected clusterManager: ClusterManager) {

    }

    public async initialize(cluster: ICluster) {
        this.cluster = cluster;
        return true
    }

        /*
    Tests if the cluster is reachable by querying for the health state
    */
    public async testConnection() {
        let success = true;
        try {
            const health = await this.requestAsync({
                method: 'GET',
                url: '/$/GetClusterHealthChunk?api-version=3.0'
            }, true)
        } catch (e) {
            if (e.toString().includes("connect ECONNREFUSED")) {
                this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load cluster health. This could mean the cluster is not reachable.")
            } else {
                this.clusterManager.addClusterLogMessage(this.cluster.id, "Failed to load cluster health. : " + e.toString())
            }

            success = false;
        }

        return success;
    }

    protected formatRequest(request: IHttpRequest, normalErrorResolution = false): AxiosRequestConfig {
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
        }

        if(!normalErrorResolution) {
            config.validateStatus = function () {
                return true; // pass through all errors as expected, let SFX handle 400/500s
            }
        }

        return config;
    }

    protected async authenticateRequest(request: AxiosRequestConfig): Promise<AxiosRequestConfig> {
        return request;
    }

    public async requestAsync(request: IHttpRequest, normalErrorResolution = false): Promise<IHttpResponse> {
        const config = this.formatRequest(request, normalErrorResolution);

        const updatedConfig = await this.authenticateRequest(config,)
        const res = await axios.request(updatedConfig);
        return {
            statusCode: res.status,
            statusMessage: res.statusText,
            data: res.data,
            headers: res.headers,
        }
    }

}