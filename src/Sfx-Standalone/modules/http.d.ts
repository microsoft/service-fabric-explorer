//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as http from "http";

import { ILog } from "./log";

export type HttpProtocol = "*" | "http:" | "https:";

export type HttpMethod  = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpContentType = "application/json" | "application/octet-stream" | string;

export interface IRequestOptions {
    method: HttpMethod;
    url: string;
    headers?: IDictionary<string | Array<string>>;
}

export interface RequestProcessor {
    (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: http.ClientRequest): void;
}

export interface ResponseHandler {
    (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: http.IncomingMessage, error: any, callback?: ResponseHandler): void;
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

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "http-client"): IHttpClient;
        getComponent(componentIdentity: "https-client"): IHttpClient;
    }
}
