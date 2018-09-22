//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.http-next" {
    import { IDictionary } from "sfx.common";
    import { ICertificate, ICertificateInfo } from "sfx.cert";

    export type SslVersion =
        "TLS" | "TLS1.2" | "TLS1.1" | "TLS1.0" | "SSL3.0";

    export type HttpMethod =
        "GET" | "POST" | "PUT" | "PATCH" | "DELETE" |
        "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";

    export interface IHttpHeader {
        name: string;
        value: string;
    }

    export interface IHttpResponse {
        httpVersion: string;
        statusCode: number;
        statusMessage: string;

        result: any;

        headers: Array<IHttpHeader>;
        body: Buffer;
    }

    export interface IHttpRequest {
        sslVersion?: SslVersion;
        clientCert?: ICertificate;

        method: HttpMethod;
        url: string;
        headers?: Array<IHttpHeader>;
        body?: any;
    }

    export interface IHttpPipeline {
        requestTemplate: IHttpRequest;

        readonly requestHandlers: Array<HttpRequestHandler>;

        readonly responseHandlers: Array<HttpResponseHandler>;

        requestAsync(request: IHttpRequest): Promise<IHttpResponse>;
    }

    export interface IHttpClient extends IHttpPipeline {
        deleteAsync(url: string): Promise<IHttpResponse>;

        getAsync(url: string): Promise<IHttpResponse>;

        patchAsync(url: string, data: any): Promise<IHttpResponse>;

        postAsync(url: string, data: any): Promise<IHttpResponse>;

        putAsync(url: string, data: any): Promise<IHttpResponse>;
    }

    export type HttpRequestHandler = (pipleline: IHttpPipeline, request: IHttpRequest) => Promise<IHttpResponse>;

    export type HttpResponseHandler = (pipleline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse) => Promise<IHttpResponse>;

    export type ServerCertValidator = (serverName: string, cert: ICertificateInfo) => Promise<boolean>;
}
