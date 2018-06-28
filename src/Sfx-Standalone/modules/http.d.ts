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
    import { IHandlerConstructor, ICertificate } from "sfx.common";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http.http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "http.https-client"): Promise<IHttpClient>;

        getComponentAsync(componentIdentity: "http.client-builder"): Promise<IHttpClientBuilder>;

        getComponentAsync(componentIdentity: "http.request-handlers.handle-json"): Promise<IHandlerConstructor<RequestAsyncProcessor>>;

        getComponentAsync(componentIdentity: "http.response-handlers.handle-redirection"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;
        getComponentAsync(componentIdentity: "http.response-handlers.handle-json"): Promise<IHandlerConstructor<ResponseAsyncHandler>>;
    }
}

declare module "sfx.http" {
    import { IDictionary, IHandlerConstructor, ICertificate } from "sfx.common";
    import { IncomingMessage, ClientRequest, Server } from "http";
    import { ILog } from "sfx.logging";

    export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

    export interface IHttpClientBuilder {
        handleRequest(constructor: IHandlerConstructor<RequestAsyncProcessor>): IHttpClientBuilder;
        handleResponse(constructor: IHandlerConstructor<ResponseAsyncHandler>): IHttpClientBuilder;
        build(protocol: string): IHttpClient;
    }

    export interface RequestAsyncProcessor {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: ClientRequest): Promise<void>;
    }

    export interface ResponseAsyncHandler {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage): Promise<any>;
    }

    export interface ServerCertValidator {
        (serverName: string, cert: ICertificate): Error | void;
    }

    export interface IClientCertificate {
        type: "pfx" | "pem";
        password: string;
    }

    export interface IPfxClientCertificate extends IClientCertificate {
        type: "pfx";
        pfx: string | Buffer;
    }

    export interface IPemClientCertificate extends IClientCertificate {
        type: "pem";
        key: string | Buffer;
        cert: string | Buffer;
    }

    export type SslProtocol = "TLS" | "TLS1.2" | "TLS1.1" | "TLS1.0" | "SSL3.0";

    export interface IRequestOptions {
        method: HttpMethod;
        url: string;
        headers?: IDictionary<string | Array<string>>;
        serverCertValidator?: ServerCertValidator;
        clientCert?: IClientCertificate;
        sslProtocol?: SslProtocol;
    }

    export interface IHttpClient {
        readonly defaultRequestOptions: IRequestOptions;

        updateDefaultRequestOptions(options: IRequestOptions): void;

        deleteAsync(url: string): Promise<IncomingMessage | any>;

        getAsync(url: string): Promise<IncomingMessage | any>;

        patchAsync(url: string, data: any): Promise<IncomingMessage | any>;

        postAsync(url: string, data: any): Promise<IncomingMessage | any>;

        putAsync(url: string, data: any): Promise<IncomingMessage | any>;

        requestAsync(requestOptions: IRequestOptions, data: any): Promise<IncomingMessage | any>;
    }
}
