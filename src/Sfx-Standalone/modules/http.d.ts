//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx" {
    import { IHttpClient } from "sfx.http";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "http-client"): Promise<IHttpClient>;
        getComponentAsync(componentIdentity: "https-client"): Promise<IHttpClient>;
    }
}

declare module "sfx.http" {
    import { IDictionary, IHandlerConstructor } from "sfx";
    import { ILog } from "sfx.logging";
    import { ClientRequest, IncomingMessage } from "http";

    export type HttpProtocol = "*" | "http:" | "https:";

    export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

    export type HttpContentType = "application/json" | "application/octet-stream" | string;

    export interface IRequestOptions {
        method: HttpMethod;
        url: string;
        headers?: IDictionary<string | Array<string>>;
    }

    export interface RequestProcessor {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: ClientRequest): void;
    }

    export interface ResponseHandler {
        (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage, error: any, callback?: ResponseHandler): void;
    }

    export interface IRequestProcessorConstructor extends IHandlerConstructor<RequestProcessor> {
    }

    export interface IResponseHandlerContructor extends IHandlerConstructor<ResponseHandler> {
    }

    export interface IHttpClient {
        delete(url: string, callback?: ResponseHandler): void;

        get(url: string, callback?: ResponseHandler): void;

        patch(url: string, data: any, callback?: ResponseHandler): void;

        post(url: string, data: any, callback?: ResponseHandler): void;

        put(url: string, data: any, callback?: ResponseHandler): void;

        request(requestOptions: IRequestOptions, data: any, callback?: ResponseHandler): void;
    }
}
