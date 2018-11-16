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

import * as uuidv4 from "uuid/v4";
import { performance } from "perf_hooks";

const RequestIdBuffer: Buffer = Buffer.alloc(16);

/**
 * Length in bytes.
 */
const RequestIdLength: number = 4;

function generateRequestId(): string {
    return uuidv4(null, RequestIdBuffer).toString("hex", 0, RequestIdLength);
}

let pipelineId: number = -1;

function generateNewPipelineId(): string {
    pipelineId += 1;

    return pipelineId.toString();
}

export default class HttpPipeline implements IHttpPipeline {
    public requestTemplate: IHttpRequest;

    protected readonly id: string;

    protected readonly log: Donuts.Logging.ILog;

    private readonly _requestHandlers: Array<HttpRequestHandler>;

    private readonly _responseHandlers: Array<HttpResponseHandler>;

    constructor(log: Donuts.Logging.ILog, requestHandlers?: Array<HttpRequestHandler>, responseHandlers?: Array<HttpResponseHandler>) {
        this.id = generateNewPipelineId();
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
        const requestId = generateRequestId();

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

        this.log.writeInfoAsync(`HTTP(${this.id}) [${requestId}] ${request.method.padStart(4, " ")} => ${request.url}`);

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
        this.log.writeInfoAsync(`HTTP(${this.id}) [${requestId}] ${request.method.padStart(4, " ")} ${response.statusCode} ${response.statusMessage} ~${rawDuration.toString().padStart(4, " ")}ms/${processDuration.toString().padStart(4, " ")}ms => ${request.url}`);

        return response;
    }
}
