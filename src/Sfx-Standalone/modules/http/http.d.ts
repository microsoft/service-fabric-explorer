//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import {
        IHttpClient,
        IHttpClientBuilder,
        RequestAsyncProcessor,
        ResponseAsyncHandler,
        ServerCertValidator
    } from "sfx.http";

    import { WebContents } from "electron";
    import { IAsyncHandlerConstructor } from "sfx.common";
    import { SelectClientCertAsyncHandler, IAadMetadata } from "sfx.http.auth";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http.http-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.https-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.node-http-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.node-https-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.electron-http-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.electron-https-client", serverCertValidator?: ServerCertValidator): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.client-builder", serverCertValidator?: ServerCertValidator): Promise<IHttpClientBuilder>;
        getComponentAsync(componentIdentity: "http.node-client-builder", serverCertValidator?: ServerCertValidator): Promise<IHttpClientBuilder>;
        getComponentAsync(componentIdentity: "http.electron-client-builder", serverCertValidator?: ServerCertValidator): Promise<IHttpClientBuilder>;

        getComponentAsync(componentIdentity: "http.request-handlers.handle-json"): Promise<IAsyncHandlerConstructor<RequestAsyncProcessor>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-redirection"): Promise<IAsyncHandlerConstructor<ResponseAsyncHandler>>;
        getComponentAsync(componentIdentity: "http.response-handlers.handle-json"): Promise<IAsyncHandlerConstructor<ResponseAsyncHandler>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-auth-cert",
            selectClientCertAsyncHandler: SelectClientCertAsyncHandler)
            : Promise<IAsyncHandlerConstructor<ResponseAsyncHandler>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-auth-aad",
            handlingHost: WebContents,
            aadMetadata: IAadMetadata)
            : Promise<IAsyncHandlerConstructor<ResponseAsyncHandler>>;
    }
}

declare module "sfx.http" {
    import { IDictionary, IAsyncHandlerConstructor } from "sfx.common";
    import { ILog } from "sfx.logging";
    import { ICertificateInfo, ICertificate } from "sfx.cert";
    import { Readable, Writable } from "stream";

    export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

    export interface IHttpResponse {
        readonly httpVersion: Promise<string>;
        readonly statusCode: Promise<number>;
        readonly statusMessage: Promise<string>;
        readonly headers: Promise<IDictionary<string>>;
    
        setEncodingAsync(encoding: string): Promise<void>;
        readAsync(): Promise<Buffer | string>;
    }

    export interface IHttpRequest {
        getHeaderAsync(name: string): Promise<any>;
        setHeaderAsync(name: string, value: any): Promise<void>;
        removeHeaderAsync(name: string): Promise<void>;
    
        writeAsync(data: string | Buffer): Promise<void>;
        abortAsync(): Promise<void>;
        endAsync(): Promise<void>;
    }
    
    export interface IHttpClientBuilder {
        handleRequestAsync(constructor: IAsyncHandlerConstructor<RequestAsyncProcessor>): Promise<IHttpClientBuilder>;
        handleResponseAsync(constructor: IAsyncHandlerConstructor<ResponseAsyncHandler>): Promise<IHttpClientBuilder>;
        buildAsync(protocol: string): Promise<IHttpClient>;
    }

    export interface RequestAsyncProcessor {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: IHttpRequest): Promise<void>;
    }

    export interface ResponseAsyncHandler {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any>;
    }

    export interface ServerCertValidator {
        (serverName: string, cert: ICertificateInfo): Error | void;
    }

    export type SslProtocol = "TLS" | "TLS1.2" | "TLS1.1" | "TLS1.0" | "SSL3.0";

    export interface IRequestOptions {
        method: HttpMethod;
        url: string;
        headers?: IDictionary<string | Array<string>>;
        clientCert?: ICertificate;
        sslProtocol?: SslProtocol;
    }

    export interface IHttpClient {
        readonly defaultRequestOptions: Promise<IRequestOptions>;

        updateDefaultRequestOptionsAsync(options: IRequestOptions): Promise<void>;

        deleteAsync<T>(url: string): Promise<T>;

        getAsync<T>(url: string): Promise<T>;

        patchAsync<T>(url: string, data: any): Promise<T>;

        postAsync<T>(url: string, data: any): Promise<T>;

        putAsync<T>(url: string, data: any): Promise<T>;

        requestAsync<T>(requestOptions: IRequestOptions, data: any): Promise<IHttpResponse | T>;
    }
}

declare module "sfx.http.auth" {
    import { ICertificateInfo, ICertificate } from "sfx.cert";

    export interface IAadMetadata {
        authority: string;
        clientId: string;
        redirect: string;
    }

    export interface SelectClientCertAsyncHandler {
        (url: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo>;
    }
}
