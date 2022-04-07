import { ClusterManager, ICluster, IClustherAuthCertificate } from "./cluster-manager";
import axios, { AxiosRequestConfig } from 'axios';

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

    getHandler: () => IHTTPRequestTransformer;
}

export interface IHttpPipeline {
    requestTemplate: IHttpRequest;
    requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
}

export class httpHandler {

    public failiedToInitialize: boolean = true;

    constructor(private cluster: ICluster, private clusterManager: ClusterManager, public transformer: IHTTPRequestTransformer) {

    }

    public async initialize() {
        try {
            await this.transformer.initialize(this.cluster);
            await this.testConnection();

        } catch(e) {

        }

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

    public async requestAsync(request: IHttpRequest, normalErrorResolution = false): Promise<IHttpResponse> {
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

        const updatedConfig = await this.transformer.transformRequest(config);

        const res = await axios.request(updatedConfig);

        return {
            statusCode: res.status,
            statusMessage: res.statusText,
            data: res.data,
            headers: res.headers,
        }
    }
}