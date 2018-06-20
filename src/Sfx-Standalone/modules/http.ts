//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";
import { IHttpClient, IRequestOptions } from "sfx.http";

import { ILog } from "sfx.logging";

import * as http from "http";
import * as https from "https";
import * as url from "url";

import * as utils from "../utilities/utils";
import { HandlerChainBuilder } from "../utilities/handlerChainBuilder";
import { electron } from "../utilities/electron-adapter";

enum HttpProtocols {
    any = "*",
    http = "http:",
    https = "https:"
}

enum HttpMethods {
    get = "GET",
    post = "POST",
    put = "PUT",
    patch = "PATCH",
    delete = "DELETE"
}

enum HttpContentTypes {
    json = "application/json",
    binary = "application/octet-stream"
}

interface RequestAsyncProcessor {
    (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: http.ClientRequest): Promise<void>;
}

interface ResponseAsyncHandler {
    (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: http.IncomingMessage): Promise<any>;
}

class HttpClient implements IHttpClient {
    private readonly log: ILog;

    private readonly protocol: string;

    private readonly requestAsyncProcessor: RequestAsyncProcessor;

    private readonly responseAsyncHandler: ResponseAsyncHandler;

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
                    response: http.IncomingMessage) => response;
        } else if (!Function.isFunction(responseAsyncHandler)) {
            throw new Error("responseAsyncHandler must be a function.");
        } else {
            this.responseAsyncHandler = responseAsyncHandler;
        }
    }

    public deleteAsync(url: string): Promise<http.IncomingMessage | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.delete
            },
            null);
    }

    public getAsync(url: string): Promise<http.IncomingMessage | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.get
            },
            null);
    }

    public patchAsync(url: string, data: any): Promise<http.IncomingMessage | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.patch,
            },
            data);
    }

    public postAsync(url: string, data: any): Promise<http.IncomingMessage | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.post,
            },
            data);
    }

    public putAsync(url: string, data: any): Promise<http.IncomingMessage | any> {
        return this.requestAsync(
            {
                url: url,
                method: HttpMethods.put,
            },
            data);
    }

    public requestAsync(requestOptions: IRequestOptions, data: any): Promise<http.IncomingMessage | any> {
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

        const options: http.RequestOptions = url.parse(requestOptions.url);

        options.method = requestOptions.method;

        if (Object.isObject(requestOptions.headers)) {
            options.headers = requestOptions.headers;
        }

        this.log.writeInfo("{}: {}", requestOptions.method, requestOptions.url);
        const request = this.makeRequest(options);

        return this.requestAsyncProcessor(this, this.log, requestOptions, data, request)
            .then(() => new Promise<http.IncomingMessage>((resolve, reject) => {
                request.on("response", (response) => resolve(response));
                request.on("error", (err: Error) => reject(err));
                request.end();
            }))
            .then((response) => this.responseAsyncHandler(this, this.log, requestOptions, data, response));
    }

    private makeRequest(options: http.RequestOptions): http.ClientRequest {
        let protocol: string;

        if (this.protocol === HttpProtocols.any) {
            protocol = options.protocol;
        } else {
            protocol = this.protocol;
        }

        try {
            if (protocol === "http:" || protocol === "http") {
                return http.request(options);
            } else if (protocol === "https:" || protocol === "https") {
                return https.request(options);
            } else {
                throw new Error(`unsupported protocol: ${protocol}`);
            }
        } catch (exception) {
            this.log.writeException(exception);
            throw exception;
        }
    }
}

namespace ResponseHandlers {
    export function handleRedirection(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
        return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: http.IncomingMessage): Promise<any> => {
            if (response.statusCode === 301
                || response.statusCode === 302
                || response.statusCode === 307
                || response.statusCode === 308) {
                const location = response.headers["location"];
                const redirectionRequestOptions: IRequestOptions = JSON.parse(JSON.stringify(requestOptions));

                redirectionRequestOptions.url = location;
                log.writeInfo("HTTP{}: Redirecting to {}", response.statusCode, redirectionRequestOptions.url);

                return client.requestAsync(redirectionRequestOptions, requestData);
            }

            if (Function.isFunction(nextHandler)) {
                return nextHandler(client, log, requestOptions, requestData, response);
            }

            return Promise.resolve(response);
        };
    }

    function isJsonResponse(log: ILog, response: http.IncomingMessage): boolean {
        const regex_filename_json = /filename=.+\.json/i;

        const contentType = response.headers["content-type"];
        const contentDisposition = response.headers["content-disposition"];

        if (!String.isString(contentType)) {
            return false;
        }

        if (contentType.indexOf(HttpContentTypes.json) >= 0) {
            return true;
        }

        if (contentType.indexOf(HttpContentTypes.binary) >= 0
            && regex_filename_json.test(contentDisposition)) {

            log.writeVerbose(`Treat Content-Type (${contentType}) as JSON since Content-Disposition header (${contentDisposition}) indicates JSON extension.`);
            return true;
        }

        return false;
    }

    export function handleJson(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
        const regex_filename_json = /filename=.+\.json/i;

        return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: http.IncomingMessage): Promise<any> => {
            if (response.statusCode >= 200 && response.statusCode < 300 && isJsonResponse(log, response)) {
                response.setEncoding("utf8");

                return new Promise((resolve, reject) => {
                    let json: string = "";

                    response.on("data", (chunk) => json += chunk);
                    response.on("end", () => {
                        try {
                            resolve(JSON.parse(json));
                        } catch (exception) {
                            reject(exception);
                        }
                    });
                });
            }

            if (Function.isFunction(nextHandler)) {
                return nextHandler(client, log, requestOptions, requestData, response);
            }

            return Promise.resolve(response);
        };
    }
}

namespace RequestHandlers {
    export function handleJson(nextHandler: RequestAsyncProcessor): RequestAsyncProcessor {
        return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: http.ClientRequest) => {
            const contentType = request.getHeader("Content-Type");

            if (String.isString(contentType)
                && contentType.indexOf(HttpContentTypes.json) >= 0) {
                const jsonBody = JSON.stringify(requestData);

                request.setHeader("Content-Length", Buffer.byteLength(jsonBody));
                request.write(jsonBody);
            } else if (!utils.isNullOrUndefined(requestData)) {
                throw new Error("Header Content-Type is missing in the request but the data is supplied.");
            }

            if (Function.isFunction(nextHandler)) {
                await nextHandler(client, log, requestOptions, requestData, request);
            }
        };
    }
}

function buildHttpClient(log: ILog, protocol: string): IHttpClient {
    const requestHandlerBuilder = new HandlerChainBuilder<RequestAsyncProcessor>();
    const responseHandlerBuilder = new HandlerChainBuilder<ResponseAsyncHandler>();

    // Request handlers
    requestHandlerBuilder.handle(RequestHandlers.handleJson);

    // Response handlers
    responseHandlerBuilder.handle(ResponseHandlers.handleRedirection);
    responseHandlerBuilder.handle(ResponseHandlers.handleJson);

    return new HttpClient(log, protocol, requestHandlerBuilder.build(), responseHandlerBuilder.build());
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: electron.app.getVersion(),
        components: [
            {
                name: "http.http-client",
                version: electron.app.getVersion(),
                descriptor: (log: ILog) => buildHttpClient(log, HttpProtocols.http),
                deps: ["logging"]
            },
            {
                name: "http.https-client",
                version: electron.app.getVersion(),
                descriptor: (log: ILog) => buildHttpClient(log, HttpProtocols.https),
                deps: ["logging"]
            }
        ]
    };
}
