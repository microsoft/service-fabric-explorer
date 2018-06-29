//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";
import { ILog } from "sfx.logging";
import { IHandlerConstructor, IHandlerChainBuilder, IDictionary } from "sfx.common";
import { ICertificate, IPemCertificate, IPfxCertificate, ICertificateInfo } from "sfx.cert";

import {
    IHttpClient,
    IRequestOptions,
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IHttpClientBuilder
} from "sfx.http";

import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as fs from "fs";
import { PeerCertificate } from "tls";
import * as crypto from "crypto";

import * as utils from "../utilities/utils";
import { HandlerChainBuilder } from "../utilities/handlerChainBuilder";
import * as appUtils from "../utilities/appUtils";

enum SslProtocols {
    tls = "TLS",
    tls12 = "TLS1.2",
    tls11 = "TLS1.1",
    tls10 = "TLS1.0",
    ssl30 = "SSL3.0"
}

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

function toJson(): any {
    let obj = this;
    const jsonObj = Object.create(null);
    const objects: Array<any> = [];

    do {
        objects.push(obj);
        obj = Object.getPrototypeOf(obj);
    } while (obj);

    while (obj = objects.pop()) {
        for (const propertyName of Object.getOwnPropertyNames(obj)) {
            jsonObj[propertyName] = obj[propertyName];
        }
    }

    return jsonObj;
}

function isPfxClientCert(cert: ICertificate): cert is IPfxCertificate {
    return cert.type === "pfx"
        && (String.isString(cert["pfx"]) || cert["pfx"] instanceof Buffer);
}

function isPemClientCert(cert: ICertificate): cert is IPemCertificate {
    return cert.type === "pem"
        && (String.isString(cert["key"]) || cert["key"] instanceof Buffer)
        && (String.isString(cert["cert"]) || cert["cert"] instanceof Buffer);
}

function objectToString(obj: any): string {
    const propertyNames = Object.getOwnPropertyNames(obj);
    let str = "";

    for (const propertyName of propertyNames) {
        str += `${propertyName}=${obj[propertyName]}, `;
    }

    return str.substr(0, str.length - 2);
}

function toCertificateInfo(cert: PeerCertificate): ICertificateInfo {
    const sha1 = crypto.createHash("sha1");

    sha1.update(cert.raw);

    return {
        subjectName: objectToString(cert.subject),
        issuerName: objectToString(cert.issuer),
        serialNumber: cert.serialNumber,
        validStart: new Date(cert.valid_from),
        validExpiry: new Date(cert.valid_to),
        thumbprint: sha1.digest("hex")
    };
}

class HttpClient implements IHttpClient {
    private readonly log: ILog;

    private readonly protocol: string;

    private readonly requestAsyncProcessor: RequestAsyncProcessor;

    private readonly responseAsyncHandler: ResponseAsyncHandler;

    private requestOptions: IRequestOptions;

    private httpRequestOptions: https.RequestOptions;

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
                    response: http.IncomingMessage) => response;
        } else if (!Function.isFunction(responseAsyncHandler)) {
            throw new Error("responseAsyncHandler must be a function.");
        } else {
            this.responseAsyncHandler = responseAsyncHandler;
        }
    }

    public updateDefaultRequestOptions(options: IRequestOptions): void {
        this.httpRequestOptions = options ? this.generateHttpRequestOptions(options) : Object.create(null);
        this.requestOptions = options ? options : Object.create(null);
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

        const httpRequestOptions = this.generateHttpRequestOptions(requestOptions);
        const options: https.RequestOptions =
            Object.assign(
                Object.create(null),
                this.httpRequestOptions,
                httpRequestOptions);

        options.headers =
            Object.assign(
                Object.create(null),
                this.httpRequestOptions.headers,
                httpRequestOptions.headers);

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

    private generateHttpRequestOptions(requestOptions: IRequestOptions): https.RequestOptions {
        const options: https.RequestOptions = url.parse(requestOptions.url);

        options.method = requestOptions.method;

        if (Object.isObject(requestOptions.headers)) {
            options.headers = Object.assign(Object.create(null), requestOptions.headers);
        }

        if (String.isString(requestOptions.sslProtocol)) {
            if (!Object.values(SslProtocols).includes(requestOptions.sslProtocol)) {
                throw new Error(`Unknown sslProtocol: ${requestOptions.sslProtocol}`);
            }

            options.secureProtocol = requestOptions.sslProtocol;
        }

        if (requestOptions.clientCert) {
            if (isPfxClientCert(requestOptions.clientCert)) {
                if (String.isString(requestOptions.clientCert.pfx)) {
                    requestOptions.clientCert.pfx = fs.readFileSync(requestOptions.clientCert.pfx);
                }

                options.pfx = requestOptions.clientCert.pfx;
                options.passphrase = requestOptions.clientCert.password;

            } else if (isPemClientCert(requestOptions.clientCert)) {
                if (String.isString(requestOptions.clientCert.cert)) {
                    requestOptions.clientCert.cert = fs.readFileSync(requestOptions.clientCert.cert);
                }

                if (String.isString(requestOptions.clientCert.key)) {
                    requestOptions.clientCert.key = fs.readFileSync(requestOptions.clientCert.key);
                }

                options.key = requestOptions.clientCert.key;
                options.cert = requestOptions.clientCert.cert;
                options.passphrase = requestOptions.clientCert.password;

            } else {
                throw new Error("Invalid clientCert: " + utils.defaultStringifier(requestOptions.clientCert));
            }
        }

        if (Function.isFunction(requestOptions.serverCertValidator)) {
            options.rejectUnauthorized = false;
            options["checkServerIdentity"] =
                (serverName, cert) => requestOptions.serverCertValidator(serverName, toCertificateInfo(cert));
        }

        return options;
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

class HttpClientBuilder implements IHttpClientBuilder {
    private readonly log: ILog;
    private readonly requestHandlerBuilder: IHandlerChainBuilder<RequestAsyncProcessor>;
    private readonly responseHandlerBuilder: IHandlerChainBuilder<ResponseAsyncHandler>;

    constructor(log: ILog) {
        this.log = log;
        this.requestHandlerBuilder = new HandlerChainBuilder<RequestAsyncProcessor>();
        this.responseHandlerBuilder = new HandlerChainBuilder<ResponseAsyncHandler>();
    }

    public handleRequest(constructor: IHandlerConstructor<RequestAsyncProcessor>): IHttpClientBuilder {
        this.requestHandlerBuilder.handle(constructor);

        return this;
    }

    public handleResponse(constructor: IHandlerConstructor<ResponseAsyncHandler>): IHttpClientBuilder {
        this.responseHandlerBuilder.handle(constructor);

        return this;
    }

    public build(protocol: string): IHttpClient {
        return new HttpClient(
            this.log, protocol,
            this.requestHandlerBuilder.build(),
            this.responseHandlerBuilder.build());
    }
}

function buildHttpClient(log: ILog, protocol: string): IHttpClient {
    const clientBuilder = new HttpClientBuilder(log);

    // Request handlers
    clientBuilder.handleRequest(RequestHandlers.handleJson);

    // Response handlers
    clientBuilder
        .handleResponse(ResponseHandlers.handleRedirection)
        .handleResponse(ResponseHandlers.handleJson);

    return clientBuilder.build(protocol);
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "http.http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog) => buildHttpClient(log, HttpProtocols.any),
                deps: ["logging"]
            },
            {
                name: "http.https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog) => buildHttpClient(log, HttpProtocols.https),
                deps: ["logging"]
            },
            {
                name: "http.client-builder",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog) => new HttpClientBuilder(log),
                deps: ["logging"]
            },

            // Request Handlers
            {
                name: "http.request-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: () => RequestHandlers.handleJson
            },

            // Response Handlers
            {
                name: "http.response-handlers.handle-redirection",
                version: appUtils.getAppVersion(),
                descriptor: () => ResponseHandlers.handleRedirection
            },
            {
                name: "http.response-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: () => ResponseHandlers.handleJson
            },
        ]
    };
}
