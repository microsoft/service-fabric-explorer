//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import {
        IHttpClient,
        IHttpClientBuilder,
        RequestAsyncProcessor,
        ResponseAsyncHandler
    } from "sfx.http";

    import { WebContents } from "electron";
    import { IHandlerConstructor } from "sfx.common";
    import { SelectClientCertAsyncHandler, IAadMetadata } from "sfx.http.auth";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http.http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.https-client"): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.node-http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.node-https-client"): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.electron-http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.electron-https-client"): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.client-builder"): Promise<IHttpClientBuilder>;
        getComponentAsync(componentIdentity: "http.node-client-builder"): Promise<IHttpClientBuilder>;
        getComponentAsync(componentIdentity: "http.electron-client-builder"): Promise<IHttpClientBuilder>;

        getComponentAsync(componentIdentity: "http.request-handlers.handle-json"): Promise<IHandlerConstructor<RequestAsyncProcessor>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-redirection"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;
        getComponentAsync(componentIdentity: "http.response-handlers.handle-json"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-auth-cert",
            selectClientCertAsyncHandler: SelectClientCertAsyncHandler)
            : Promise<IHandlerConstructor<ResponseAsyncHandler>>;
            
        getComponentAsync(componentIdentity: "http.response-handlers.handle-auth-aad",
            handlingHost: WebContents,
            aadMetadata: IAadMetadata)
            : Promise<IHandlerConstructor<ResponseAsyncHandler>>;
    }
}

declare module "sfx.http" {
    import { IDictionary, IHandlerConstructor } from "sfx.common";
    import { ILog } from "sfx.logging";
    import { ICertificateInfo, ICertificate } from "sfx.cert";
    import { Readable, Writable } from "stream";

    export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

    export interface IHttpResponse extends Readable {
        httpVersion: string;
        statusCode: number;
        statusMessage: string;
        headers: IDictionary<string>;

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "aborted", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "aborted", listener: () => void): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "aborted", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "aborted", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "aborted", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "aborted", listener: () => void): this;

        removeListener(event: string, listener: (...args: any[]) => void): this;
        removeListener(event: "aborted", listener: () => void): this;
    }

    export interface IHttpRequest extends Writable {
        getHeader(name: string): any;
        setHeader(name: string, value: any): void;
        abort(): void;

        addListener(event: string, listener: (...args: any[]) => void): this;
        addListener(event: "response", listener: (response: IHttpResponse) => void): this;
        addListener(event: "abort", listener: () => void): this;

        emit(event: string | symbol, ...args: any[]): boolean;
        emit(event: "response", listener: (response: IHttpResponse) => void): boolean;
        emit(event: "abort", listener: () => void): boolean;

        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "response", listener: (response: IHttpResponse) => void): this;
        on(event: "abort", listener: () => void): this;

        once(event: string, listener: (...args: any[]) => void): this;
        once(event: "response", listener: (response: IHttpResponse) => void): this;
        once(event: "abort", listener: () => void): this;

        prependListener(event: string, listener: (...args: any[]) => void): this;
        prependListener(event: "response", listener: (response: IHttpResponse) => void): this;
        prependListener(event: "abort", listener: () => void): this;

        prependOnceListener(event: string, listener: (...args: any[]) => void): this;
        prependOnceListener(event: "response", listener: (response: IHttpResponse) => void): this;
        prependOnceListener(event: "abort", listener: () => void): this;

        removeListener(event: string, listener: (...args: any[]) => void): this;
        removeListener(event: "response", listener: (response: IHttpResponse) => void): this;
        removeListener(event: "abort", listener: () => void): this;
    }

    export interface IHttpClientBuilder {
        handleRequest(constructor: IHandlerConstructor<RequestAsyncProcessor>): IHttpClientBuilder;
        handleResponse(constructor: IHandlerConstructor<ResponseAsyncHandler>): IHttpClientBuilder;
        build(protocol: string): IHttpClient;
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
        serverCertValidator?: ServerCertValidator;
        clientCert?: ICertificate;
        sslProtocol?: SslProtocol;
    }

    export interface IHttpClient {
        readonly defaultRequestOptions: IRequestOptions;

        updateDefaultRequestOptions(options: IRequestOptions): void;

        deleteAsync<T>(url: string): Promise<IHttpResponse | T>;

        getAsync<T>(url: string): Promise<IHttpResponse | T>;

        patchAsync<T>(url: string, data: any): Promise<IHttpResponse | T>;

        postAsync<T>(url: string, data: any): Promise<IHttpResponse | T>;

        putAsync<T>(url: string, data: any): Promise<IHttpResponse | T>;

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
