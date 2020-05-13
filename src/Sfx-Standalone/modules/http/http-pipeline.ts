//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    HttpRequestHandler,
    HttpResponseHandler
} from "sfx.http";

import { performance } from "perf_hooks";
import * as random from "donuts.node/random";

export default class HttpPipeline implements IHttpPipeline {
    public requestTemplate: IHttpRequest;

    protected readonly id: string;

    protected readonly log: Donuts.Logging.ILog;

    private readonly _requestHandlers: Array<HttpRequestHandler>;

    private readonly _responseHandlers: Array<HttpResponseHandler>;

    constructor(log: Donuts.Logging.ILog, requestHandlers?: Array<HttpRequestHandler>, responseHandlers?: Array<HttpResponseHandler>) {
        this.id = random.generateUid(6);
        this.log = log;
        this._requestHandlers = [];
        this._responseHandlers = [];

        if (requestHandlers) {
            this._requestHandlers.push(...requestHandlers);
        }

        if (responseHandlers) {
            this._responseHandlers.push(...responseHandlers);
        }
    }

    public get requestHandlers(): Array<HttpRequestHandler> {
        return this._requestHandlers;
    }

    public get responseHandlers(): Array<HttpResponseHandler> {
        return this._responseHandlers;
    }

    public async requestAsync(request: IHttpRequest): Promise<IHttpResponse> {
        const requestId = random.generateUid(8);

        if (this.requestTemplate) {
            const headers = [];

            if (this.requestTemplate.headers) {
                headers.push(...this.requestTemplate.headers);
            }

            if (request.headers) {
                headers.push(...headers);
            }

            request = Object.assign(Object.create(null), this.requestTemplate, request);
            request.headers = headers;
        }

        this.log.writeInfoAsync(`${this.id} HTTP ${request.method.padStart(4, " ")} ${requestId} => ${request.url}`);

        let response: IHttpResponse;
        const rawStartTime = performance.now();

        for (const handleRequestAsync of this._requestHandlers) {
            response = await handleRequestAsync(this, request);

            if (response) {
                break;
            }
        }

        if (!response) {
            throw new Error(`HTTP(${this.id}): No request handler handled request.`);
        }

        const rawDuration = (performance.now() - rawStartTime).toFixed(0);

        for (const handleResponseAsync of this._responseHandlers) {
            response = await handleResponseAsync(this, request, response) || response;
        }

        const processDuration = (performance.now() - rawStartTime).toFixed(0);
        this.log.writeInfoAsync(`${this.id} HTTP ${request.method.padStart(4, " ")} ${requestId} ${response.statusCode} ${response.statusMessage} ~${rawDuration.toString().padStart(4, " ")}ms/${processDuration.toString().padStart(4, " ")}ms <= ${request.url}`);
        this.log.writeInfoAsync(`${JSON.stringify(response.data)}`);

        return response;
    }
}
