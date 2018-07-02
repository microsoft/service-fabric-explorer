//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpClient,
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpResponse,
    IHttpRequest
} from "sfx.http";

import { IDictionary } from "sfx.common";
import { ILog } from "sfx.logging";

import * as uuidv4 from "uuid/v4";

import { HttpProtocols, HttpMethods, SslProtocols } from "./common";
import * as utils from "../../utilities/utils";

function toJSON(): IDictionary<any> {
    const jsonObject: IDictionary<any> = Object.create(null);
    const inheritanceStack: Array<Object> = [];

    let prototypeObj = this;

    do {
        inheritanceStack.push(prototypeObj);
        prototypeObj = Object.getPrototypeOf(prototypeObj);
    } while (prototypeObj);

    while (prototypeObj = inheritanceStack.pop()) {
        for (const property in prototypeObj) {
            jsonObject[property] = this[property];
        }
    }

    return jsonObject;
}

export default abstract class HttpClientBase<THttpRequestOptions> implements IHttpClient {
    protected readonly log: ILog;

    protected readonly protocol: string;

    protected readonly requestAsyncProcessor: RequestAsyncProcessor;

    protected readonly responseAsyncHandler: ResponseAsyncHandler;

    protected requestOptions: IRequestOptions;

    protected httpRequestOptions: THttpRequestOptions;

    public get defaultRequestOptions(): IRequestOptions {
        return this.requestOptions;
    }

    constructor(
        log: ILog,
        protocol: string,
        requestAsyncProcessor: RequestAsyncProcessor,
        responseAsyncHandler: ResponseAsyncHandler) {

        if (!Object.isObject(log)) {
            throw new Error("log must be supplied.");
        }

        if (String.isString(protocol) && protocol.trim() === "") {
            protocol = undefined;
        }

        this.requestOptions = Object.create(null);
        this.httpRequestOptions = Object.create(null);
        this.log = log;
        this.protocol = utils.getValue(protocol, HttpProtocols.any);

        // request processor.
        if (utils.isNullOrUndefined(requestAsyncProcessor) || Function.isFunction(requestAsyncProcessor)) {
            this.requestAsyncProcessor = requestAsyncProcessor;
        } else {
            throw new Error("requestAsyncProcessor must be a function.");
        }

        // response processor.
        if (utils.isNullOrUndefined(responseAsyncHandler)) {
            this.responseAsyncHandler =
                async (client: IHttpClient,
                    log: ILog,
                    requestOptions: IRequestOptions,
                    requestData: any,
                    response: IHttpResponse) => response;
        } else if (!Function.isFunction(responseAsyncHandler)) {
            throw new Error("responseAsyncHandler must be a function.");
        } else {
            this.responseAsyncHandler = responseAsyncHandler;
        }
    }

    public updateDefaultRequestOptions(options: IRequestOptions): void {
        this.httpRequestOptions = options ? this.generateHttpRequestOptions(options) : Object.create(null);
        this.requestOptions = options ? options : Object.create(null);

        if (this.httpRequestOptions) {
            Object.defineProperty(
                this.httpRequestOptions,
                "toJSON",
                {
                    writable: true,
                    configurable: false,
                    enumerable: false,
                    value: toJSON
                });
        }
    }

    public deleteAsync(url: string): Promise<IHttpResponse | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.delete
            },
            null);
    }

    public getAsync(url: string): Promise<IHttpResponse | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.get
            },
            null);
    }

    public patchAsync(url: string, data: any): Promise<IHttpResponse | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.patch,
            },
            data);
    }

    public postAsync(url: string, data: any): Promise<IHttpResponse | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.post,
            },
            data);
    }

    public putAsync(url: string, data: any): Promise<IHttpResponse | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.put,
            },
            data);
    }

    public requestAsync(requestOptions: IRequestOptions, data: any): Promise<IHttpResponse | any> {
        if (!Object.isObject(requestOptions)) {
            throw new Error("requestOptions must be supplied.");
        }

        if (!String.isString(requestOptions.url)) {
            throw new Error("requestOptions.url must be supplied.");
        }

        if (!String.isString(requestOptions.method) || requestOptions.method.trim() === "") {
            throw new Error("requestOptions.method must be supplied.");
        }

        if (!utils.isNullOrUndefined(data)
            && (requestOptions.method === HttpMethods.get || requestOptions.method === HttpMethods.delete)) {
            throw new Error("For HTTP method, GET and DELETE, data cannot be supplied.");
        }

        const requestId = `HTTP:${uuidv4()}`;

        this.log.writeInfo(`[${requestId}] Generating http request options ...`);
        const httpRequestOptions = this.generateHttpRequestOptions(requestOptions);

        this.log.writeInfo(`[${requestId}] Creating request: HTTP ${requestOptions.method} => ${requestOptions.url}`);
        const request = this.makeRequest(httpRequestOptions);

        this.log.writeInfo(`[${requestId}] Processing HTTP request ...`);
        return this.requestAsyncProcessor(this, this.log, requestOptions, data, request)
            .then(() => new Promise<IHttpResponse>((resolve, reject) => {
                request.on("response", (response) => resolve(response));
                request.on("error", (err: Error) => reject(err));

                this.log.writeInfo(`[${requestId}] Sending HTTP request ...`);
                request.end();
            }))
            .then(
                (response) => {
                    this.log.writeInfo(`[${requestId}] Received response: HTTP/${response.httpVersion} ${response.statusCode} ${response.statusMessage}`);

                    this.log.writeInfo(`[${requestId}] Processing HTTP response ...`);
                    try {
                        return this.responseAsyncHandler(this, this.log, requestOptions, data, response);
                    } finally {
                        this.log.writeInfo(`[${requestId}] Processing HTTP response completed.`);
                    }
                },
                (reason) => {
                    this.log.writeInfo(`[${requestId}] Failed sending HTTP request: ${reason}`);
                    return reason;
                });
    }

    protected abstract generateHttpRequestOptions(requestOptions: IRequestOptions): THttpRequestOptions;

    protected abstract makeRequest(options: THttpRequestOptions): IHttpRequest;
}
