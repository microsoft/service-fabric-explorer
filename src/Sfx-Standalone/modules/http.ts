//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";

import { ILog } from "../@types/log";
import {
    ResponseHandler,
    HttpContentType,
    IHttpClient,
    HttpProtocol,
    RequestProcessor,
    IResponseHandlerContructor,
    IRequestProcessorConstructor,
    IRequestOptions,
    HttpMethod
} from "../@types/http";
import * as utils from "../utilities/utils";
import error from "../utilities/errorUtil";
import { HandlerChainBuilder } from "../utilities/handlerChainBuilder";

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

class HttpClientBuilder {
    private readonly responseHandlerBuilder: IHandlerChainBuilder<ResponseHandler>;

    private readonly requestProcessorBuilder: IHandlerChainBuilder<RequestProcessor>;

    private readonly headers: IDictionary<string | Array<string>>;

    private readonly protocol: HttpProtocol;

    constructor(protocol?: HttpProtocol) {
        this.requestProcessorBuilder = new HandlerChainBuilder();
        this.responseHandlerBuilder = new HandlerChainBuilder();
        this.headers = {};

        if (String.isString(protocol) && protocol.trim() === "") {
            protocol = undefined;
        }

        this.protocol = utils.getEither(protocol, HttpProtocols.any);
    }

    public build(log: ILog): IHttpClient {
        this.handleRequest(() => (client, log, requestOptions, requestData, request) => request.end());
        this.responseHandlerBuilder.handle(() =>
            (client, log, requestOptions, requestData, response, exception, callback) => callback(client, log, requestOptions, requestData, response, exception, callback));

        return new HttpClient(log, this.protocol, this.headers, this.requestProcessorBuilder.build(), this.responseHandlerBuilder.build());
    }

    public configureHeader(name: string, values: string | Array<string>): HttpClientBuilder {
        if (!String.isString(name) || name.trim() === "") {
            throw error("name must not be null/undefined or whitespaces.");
        }

        if (utils.isNullOrUndefined(values)) {
            delete this.headers[name];
        } else {
            this.headers[name] = values;
        }

        return this;
    }

    public handleResponse(constructor: IResponseHandlerContructor): HttpClientBuilder {
        this.responseHandlerBuilder.handle(constructor);
        return this;
    }

    public handleRequest(constructor: IRequestProcessorConstructor): HttpClientBuilder {
        this.requestProcessorBuilder.handle(constructor);
        return this;
    }

    public handleRedirectionResponse(): HttpClientBuilder {
        return this.handleResponse((nextHandler) =>
            (client, log, requestOptions, data, response, error, callback) => {
                if (utils.isNullOrUndefined(error) &&
                    (response.statusCode === 301
                        || response.statusCode === 302
                        || response.statusCode === 307
                        || response.statusCode === 308)) {
                    const location = response.headers["location"];
                    let redirectionRequestOptions: IRequestOptions = JSON.parse(JSON.stringify(requestOptions));

                    redirectionRequestOptions.url = location;
                    log.writeInfo("HTTP{}: Redirecting to {}", response.statusCode, redirectionRequestOptions.url);
                    client.request(redirectionRequestOptions, data, callback);
                } else if (Function.isFunction(nextHandler)) {
                    nextHandler(client, log, requestOptions, data, response, error, callback);
                }
            });
    }

    public handleJsonRequest(): HttpClientBuilder {
        return this.handleRequest((nextHandler) =>
            (client, log, requestOptions, data, request) => {
                const contentType = request.getHeader("Content-Type");

                if (String.isString(contentType)
                    && contentType.indexOf(HttpContentTypes.json) >= 0) {
                    const jsonBody = JSON.stringify(data);

                    request.setHeader("Content-Length", Buffer.byteLength(jsonBody));
                    request.write(jsonBody);
                } else if (!utils.isNullOrUndefined(data)) {
                    throw error("Header Content-Type is missing in the request but the data is supplied.");
                }

                if (Function.isFunction(nextHandler)) {
                    nextHandler(client, log, requestOptions, data, request);
                }
            });
    }
}

export abstract class ResponseHandlerHelper {
    private static regex_filename_json = /filename=.+\.json/i;

    public static handleJsonResponse<TJson>(callback: (error, json: TJson) => void): ResponseHandler {
        if (!Function.isFunction(callback)) {
            throw error("callback function must be supplied.");
        }

        return (client, log, requestOptions, requestData, response, exception) => {
            if (!utils.isNullOrUndefined(exception)) {
                callback(exception, null);
            } else if (response.statusCode >= 200 && response.statusCode < 300) {
                const contentType = response.headers["content-type"];

                if (String.isString(contentType)) {
                    if (contentType.indexOf(HttpContentTypes.binary)) {
                        const contentDisposition = response.headers["content-disposition"];

                        if (!ResponseHandlerHelper.regex_filename_json.test(contentDisposition)) {
                            callback(error("Unable to handle non-json response."), null);
                        }

                        log.writeVerbose("Treat Content-Type: {} as JSON since Content-Disposition header indicates JSON extention.", contentType);
                    }

                    let json: string = "";

                    response.setEncoding("utf8");
                    response.on("data", (chunk) => json += chunk);
                    response.on("end", () => {
                        try {
                            callback(null, <TJson>JSON.parse(json));
                        } catch (error) {
                            callback(error, null);
                        }
                    });
                    return;
                }
            } else {
                callback(error("Response status code, {}, cannot be handled.", response.statusCode), null);
            }
        };
    }

    public static saveToFile(file: string | number, autoClose: boolean, callback: (error) => void): ResponseHandler {
        if (!String.isString(file) && !Number.isNumber(file)) {
            throw error("file must be either the path of the file or the fd");
        }

        return (client, log, requestOptions, requestData, response, exception) => {
            if (!utils.isNullOrUndefined(exception)) {
                callback(exception);
            } else if (response.statusCode >= 200 && response.statusCode < 300) {
                log.writeVerbose("Writing HTTP response to file: {}", file);
                const fileStream = fs.createWriteStream(
                    String.isString(file) ? file : null,
                    {
                        fd: Number.isNumber(file) ? file : undefined,
                        autoClose: autoClose
                    });

                response
                    .pipe(fileStream)
                    .on("error", (error) => callback(error))
                    .on("finish", () => {
                        fileStream.end();
                        callback(null);
                    });
            }
        };
    }
}

export class HttpClient implements IHttpClient {
    private readonly log: ILog;

    private readonly protocol: HttpProtocol;

    private readonly defaultHeadersJSON: string;

    private readonly requestProcessor: RequestProcessor;

    private readonly responseHandler: ResponseHandler;

    constructor(
        log: ILog,
        protocol: HttpProtocol,
        defaultHeaders: IDictionary<string | Array<string>>,
        requestProcessor: RequestProcessor,
        responseHandler: ResponseHandler) {

        if (!Object.isObject(log)) {
            throw error("log must be supplied.");
        }

        if (String.isString(protocol) && protocol.trim() === "") {
            protocol = undefined;
        }

        this.log = log;
        this.protocol = utils.getEither(protocol, HttpProtocols.any);
        this.defaultHeadersJSON = undefined;

        if (!utils.isNullOrUndefined(defaultHeaders)) {
            this.defaultHeadersJSON = JSON.stringify(defaultHeaders);
        }

        // request processor.
        if (utils.isNullOrUndefined(requestProcessor)) {
            this.requestProcessor = (client, requestOptions, requestData, request) => request.end();
        } else if (!Function.isFunction(requestProcessor)) {
            throw error("requestProcessor must be a function.");
        } else {
            this.requestProcessor = requestProcessor;
        }

        // response processor.
        if (utils.isNullOrUndefined(responseHandler)) {
            this.responseHandler =
                (client, log, requestOptions, requestData, response, error, callback) => callback(client, log, requestOptions, requestData, response, error, callback);
        } else if (!Function.isFunction(responseHandler)) {
            throw error("responseHandler must be a function.");
        } else {
            this.responseHandler = responseHandler;
        }
    }

    public delete(url: string, callback?: ResponseHandler): void {
        this.request(
            {
                url: url,
                method: HttpMethods.delete
            },
            null,
            callback);
    }

    public get(url: string, callback?: ResponseHandler): void {
        this.request(
            {
                url: url,
                method: HttpMethods.get
            },
            null,
            callback);
    }

    public patch(url: string, data: any, callback?: ResponseHandler): void {
        this.request(
            {
                url: url,
                method: HttpMethods.patch,
            },
            data,
            callback);
    }

    public post(url: string, data: any, callback?: ResponseHandler): void {
        this.request(
            {
                url: url,
                method: HttpMethods.post,
            },
            data,
            callback);
    }

    public put(url: string, data: any, callback?: ResponseHandler): void {
        this.request(
            {
                url: url,
                method: HttpMethods.put,
            },
            data,
            callback);
    }

    public request(requestOptions: IRequestOptions, data: any, callback?: ResponseHandler): void {
        if (!Object.isObject(requestOptions)) {
            throw error("requestOptions must be supplied.");
        }

        if (!String.isString(requestOptions.url)) {
            throw error("requestOptions.url must be supplied.");
        }

        if (!String.isString(requestOptions.method) || requestOptions.method.trim() === "") {
            throw error("requestOptions.method must be supplied.");
        }

        if (!utils.isNullOrUndefined(data)
            && (requestOptions.method === HttpMethods.get || requestOptions.method === HttpMethods.delete)) {
            throw error("For HTTP method, GET and DELETE, data cannot be supplied.");
        }

        let headers: IDictionary<string | Array<string>> = undefined;

        if (!utils.isNullOrUndefined(this.defaultHeadersJSON)) {
            headers = JSON.parse(this.defaultHeadersJSON);
        }

        if (Object.isObject(requestOptions.headers)) {
            Object.assign(headers || {}, requestOptions.headers);
        }

        const options: http.RequestOptions = url.parse(requestOptions.url);

        options.method = requestOptions.method;
        options.headers = headers;

        this.log.writeInfo("{}: {}", requestOptions.method, requestOptions.url);
        const request = this.sendRequest(options, (error, response) => this.responseHandler(this, this.log, requestOptions, data, response, error, callback));

        if (request !== undefined) {
            this.requestProcessor(this, this.log, requestOptions, data, request);
        }
    }

    private sendRequest(options: http.RequestOptions, callback?: (error, res: http.IncomingMessage) => void): http.ClientRequest {
        let protocol: string;

        if (this.protocol === HttpProtocols.any) {
            protocol = options.protocol;
        } else {
            protocol = this.protocol;
        }

        try {

            if (protocol === "http:" || protocol === "http") {
                return http.request(options, (res) => callback(null, res));
            } else if (protocol === "https:" || protocol === "https") {
                return https.request(options, (res) => callback(null, res));
            } else {
                throw error("unsupported protocol: {}", protocol);
            }
        } catch (exception) {
            this.log.writeException(exception);
            callback(exception, null);
            return undefined;
        }
    }
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: "1.0.0",
        components: [
            {
                name: "https-client-builder",
                version: "1.0.0",
                descriptor: (protocol?: HttpProtocol) => new HttpClientBuilder(protocol),
            },
            {
                name: "http-client",
                version: "1.0.0",
                descriptor: (log: ILog) => {
                    const httpClientBuilder = new HttpClientBuilder(HttpProtocols.any);

                    httpClientBuilder
                        .handleJsonRequest()
                        .handleRedirectionResponse();

                    return httpClientBuilder.build(log);
                },
                deps: ["log"]
            },
            {
                name: "https-client",
                version: "1.0.0",
                descriptor: (log: ILog) => {
                    const httpClientBuilder = new HttpClientBuilder(HttpProtocols.https);

                    httpClientBuilder
                        .handleJsonRequest()
                        .handleRedirectionResponse();

                    return httpClientBuilder.build(log);
                },
                deps: ["log"]
            }
        ]
    };
}
