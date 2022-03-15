import { ICluster, IClustherAuthCertificate } from "./cluster-manager";
import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios';
import { Agent} from 'https';
import { readFile } from 'fs/promises';

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
    // httpVersion: string;
    statusCode: number;
    statusMessage: string;

    data: any;

    headers: Record<string, string>;
    // body: Buffer;
}

export interface IHttpRequest {
    sslVersion?: SslVersion;
    // clientCert?: ICertificate;

    method: HttpMethod;
    url: string;
    headers?: Array<IHttpHeader>;
    body?: any;
}

export interface IHttpPipeline {
    requestTemplate: IHttpRequest;

    // readonly requestHandlers: Array<HttpRequestHandler>;

    // readonly responseHandlers: Array<HttpResponseHandler>;

    requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
}

export class httpHandler {

    private httpsAgent: Agent;
    // private 

    constructor(private cluster: ICluster) {

    }

    public async initialize() {
        if(this.cluster.authType.authType === "certificate") {
            const auth = this.cluster.authType as IClustherAuthCertificate; 

            const cert = await readFile(auth.certificatePath);

            this.httpsAgent = new Agent({
                rejectUnauthorized: false,
                pfx:  cert,
                passphrase: '' //TODO Pass this down
              })
        }
    }

    public async requestAsync(request: IHttpRequest): Promise<IHttpResponse> {
        const headers: Record<string, string> = {};

        if (request.headers) {
            request.headers.forEach(header => {
                headers[header.name] = header.value;
            })
        }
        console.log(`${this.cluster.url}/${request.url}`)

        let config: AxiosRequestConfig = {
            method: request.method,
            url: `${this.cluster.url}/${request.url}`,
            data: request.body, 
            headers
        }

        if(this.httpsAgent) {
            config.httpsAgent = this.httpsAgent;
        }

        try {
            const res = await axios.request(config);

            return {
                statusCode: res.status,
                statusMessage: res.statusText,
                data: res.data,
                headers: res.headers,
            }
        }catch(e) {
            const f = e as AxiosError;
            // f.toJSON();
            // console.log(e)
            console.log(  f.toJSON()) 
            return e;
        }

    }
}