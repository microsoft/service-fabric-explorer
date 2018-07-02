//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog } from "sfx.logging";

import {
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpRequest
} from "sfx.http";

import * as http from "http";

import HttpClientBase from "./http-client-base";

export class HttpClient extends HttpClientBase<http.RequestOptions> {
    constructor(
        log: ILog,
        protocol: string,
        requestAsyncProcessor: RequestAsyncProcessor,
        responseAsyncHandler: ResponseAsyncHandler) {
        super(log, protocol, requestAsyncProcessor, responseAsyncHandler);
    }

    protected generateHttpRequestOptions(requestOptions: IRequestOptions): http.RequestOptions {
        throw new Error("Method not implemented.");
    }

    protected makeRequest(options: http.RequestOptions): IHttpRequest {
        throw new Error("Method not implemented.");
    }
}
