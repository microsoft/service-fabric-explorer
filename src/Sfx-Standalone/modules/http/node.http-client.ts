//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpClient,
    RequestAsyncProcessor,
    ResponseAsyncHandler,
    IRequestOptions
} from "sfx.http";

import { ILog } from "sfx.logging";
import { ICertificateLoader, IPkiCertificateService, IPemCertificate, IPfxCertificate, ICertificateInfo } from "sfx.cert";

import * as https from "https";
import * as http from "http";
import * as url from "url";
import * as crypto from "crypto";

import { HttpProtocols, HttpMethods, SslProtocols } from "./common";
import * as utils from "../../utilities/utils";
import { PeerCertificate } from "tls";

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

export class HttpClient implements IHttpClient {
    private readonly log: ILog;

    private readonly certLoader: ICertificateLoader;

    private readonly pkiCertSvc: IPkiCertificateService;

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
        certLoader: ICertificateLoader,
        protocol: string,
        requestAsyncProcessor: RequestAsyncProcessor,
        responseAsyncHandler: ResponseAsyncHandler) {

        if (!Object.isObject(log)) {
            throw new Error("log must be supplied.");
        }

        if (!Object.isObject(certLoader)) {
            throw new Error("certLoader must be supplied.");
        }

        if (String.isString(protocol) && protocol.trim() === "") {
            protocol = undefined;
        }

        this.requestOptions = Object.create(null);
        this.httpRequestOptions = Object.create(null);
        this.log = log;
        this.certLoader = certLoader;
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
            requestOptions.clientCert = this.certLoader.load(requestOptions.clientCert);

            if (requestOptions.clientCert.type === "pfx") {
                options.pfx = (<IPfxCertificate>requestOptions.clientCert).pfx;
                options.passphrase = (<IPfxCertificate>requestOptions.clientCert).password;

            } else if (requestOptions.clientCert.type === "pem") {
                options.key = (<IPemCertificate>requestOptions.clientCert).key;
                options.cert = (<IPemCertificate>requestOptions.clientCert).cert;
                options.passphrase = (<IPemCertificate>requestOptions.clientCert).password;

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
