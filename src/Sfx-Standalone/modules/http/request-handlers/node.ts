//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    IHttpHeader,
    ServerCertValidator,
    HttpRequestHandler
} from "sfx.http";

import { IPemCertificate, IPfxCertificate, ICertificateInfo } from "sfx.cert";

import * as url from "url";
import * as http from "http";
import * as https from "https";
import * as crypto from "crypto";
import * as tls from "tls";
import * as utils from "donuts.node/utils";

interface IHttpContext {
    httpsAgent: https.Agent;
    httpAgent: http.Agent;
}

const DummyClientPfx: Buffer =
    Buffer.from(
        "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",
        "base64");
const DummyClientPfxPassphrase: string = "1234";

function applyHeaders(requestHeaders: http.OutgoingHttpHeaders, headers: Array<IHttpHeader>): void {
    for (const header of headers) {
        let requestHeader: any = requestHeaders[header.name];

        if (Array.isArray(requestHeader)) {
            requestHeader.push(header.value);

        } else if (requestHeader !== undefined && requestHeader !== null) {
            requestHeader = [requestHeader, header.value];
            requestHeaders[header.name] = requestHeader;

        } else {
            requestHeaders[header.name] = header.value;
        }
    }
}

function generateHeaders(headers: Array<string>): Array<IHttpHeader> {
    let header: IHttpHeader;
    const generatedHeaders: Array<IHttpHeader> = [];

    for (let valueIndex = 0; valueIndex < headers.length; valueIndex++) {
        if (valueIndex % 2 === 0) {
            header = Object.create(null);
            header.name = headers[valueIndex];
        } else {
            header.value = headers[valueIndex];
            generatedHeaders.push(header);
        }
    }

    return generatedHeaders;
}

function generateBodyAsync(httpResponse: http.IncomingMessage): Promise<Buffer> {
    if (!httpResponse.readable) {
        return Promise.resolve(new Buffer(0));
    }

    return new Promise<Buffer>((resolve, reject) => {
        const bodyData: Array<number> = [];

        httpResponse.on("data", (chunk: Buffer) => {
            bodyData.push(...chunk);
        });

        httpResponse.on("end", () => resolve(new Buffer(bodyData)));

        httpResponse.on("error", (err) => reject(err));
    });
}

function handleRequestAsync(this: IHttpContext, validateServerCert: ServerCertValidator, pipeline: IHttpPipeline, request: IHttpRequest): Promise<IHttpResponse> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions = Object.assign(Object.create(null), url.parse(request.url));
        let httpRequest: http.ClientRequest;
        let body: string | Buffer;

        if (Buffer.isBuffer(request.body) || typeof request.body === "string") {
            body = request.body;

        } else {
            body = JSON.stringify(request.body);

            if (!request.headers) {
                request.headers = [];
            }

            const headerIndex = request.headers.findIndex((value) => value.name === "Content-Type");
            const contentTypeHeader: IHttpHeader = headerIndex < 0 ? Object.create(null) : request.headers[headerIndex];

            contentTypeHeader.name = "Content-Type";
            contentTypeHeader.value = "application/json; charset=utf-8";

            if (headerIndex >= 0) {
                request.headers[headerIndex] = contentTypeHeader;
            } else {
                request.headers.push(contentTypeHeader);
            }
        }

        options.method = request.method;

        if (request.headers) {
            options.headers = Object.create(null);
            applyHeaders(options.headers, request.headers);
        }

        if (options.protocol === "http:") {
            if (this && this.httpAgent) {
                options.agent = this.httpAgent;
            }

            httpRequest = http.request(options);

        } else if (options.protocol === "https:") {

            if (this && this.httpsAgent) {
                options.agent = this.httpsAgent;
            }

            if (request.sslVersion) {
                options["secureProtocol"] = request.sslVersion;
            }

            if (validateServerCert) {
                options["rejectUnauthorized"] = false;
            }

            if (request.clientCert) {
                if (request.clientCert.type === "pem") {
                    const pemCert = <IPemCertificate>request.clientCert;

                    options["cert"] = pemCert.cert;

                    if (pemCert.key) {
                        options["key"] = pemCert.key;
                    }

                    if (pemCert.password) {
                        options["passphrase"] = pemCert.password;
                    }

                } else if (request.clientCert.type === "pfx") {
                    const pemCert = <IPfxCertificate>request.clientCert;

                    options["pfx"] = pemCert.pfx;

                    if (pemCert.password) {
                        options["passphrase"] = pemCert.password;
                    }

                } else {
                    reject(new Error(`Invalid clientCert.type: ${request.clientCert.type}`));
                    return;
                }
            }

            try {
                httpRequest = https.request(options);
            } catch (err) {
                if (err && err.message === "mac verify failure") {
                    delete options["key"];
                    delete options["cert"];
                    delete options["passphrase"];
                    delete options["pfx"];

                    httpRequest = https.request(options);

                } else {
                    reject(err);
                    return undefined;
                }
            }

        } else {
            return undefined;
        }

        httpRequest.on("response", async (response: http.IncomingMessage) => {
            const httpResponse: IHttpResponse = Object.create(null);

            httpResponse.httpVersion = response.httpVersion;
            httpResponse.statusCode = response.statusCode;
            httpResponse.statusMessage = response.statusMessage;
            httpResponse.headers = generateHeaders(response.rawHeaders);
            httpResponse.body = await generateBodyAsync(response);

            resolve(httpResponse);
        });

        if (options.protocol === "https:" && validateServerCert) {
            httpRequest.on("socket", (socket: tls.TLSSocket) => {
                socket.once("secureConnect", () => {
                    if (!socket.authorized) {
                        const peerCert = socket.getPeerCertificate();

                        if (utils.object.isEmpty(peerCert)) {
                            return;
                        }

                        const host = url.parse(request.url).host;

                        if (!validateServerCert(host, toCertificateInfo(peerCert))) {
                            socket.destroy(socket.authorizationError);
                        }
                    }
                });
            });
        }

        httpRequest.on("error", (error) => reject(error));

        if (body) {
            httpRequest.write(body);
        }

        httpRequest.end();
    });
}

function objectToString(obj: any): string {
    const propertyNames = Object.getOwnPropertyNames(obj);
    let str = "";

    for (const propertyName of propertyNames) {
        str += `${propertyName}=${obj[propertyName]}, `;
    }

    return str.substr(0, str.length - 2);
}

function toCertificateInfo(cert: tls.PeerCertificate): ICertificateInfo {
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

export default function createRequestHandler(serverCertValidator?: ServerCertValidator): HttpRequestHandler {
    const context: IHttpContext = {
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true })
    };

    if (serverCertValidator) {
        return handleRequestAsync.bind(context, serverCertValidator);
    }

    return handleRequestAsync.bind(context, undefined);
}
