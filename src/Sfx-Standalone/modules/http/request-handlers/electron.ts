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

import * as crypto from "crypto";
import * as uuidv4 from "uuid/v4";
import * as electron from "electron";
import { ICertificateInfo } from "sfx.cert";

function applyHeaders(requestHeaders: electron.ClientRequest, headers: Array<IHttpHeader>): void {
    for (const header of headers) {
        requestHeaders.setHeader(header.name, header.value);
    }
}

function generateHeaders(headers: any): Array<IHttpHeader> {
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

function generateBody(httpResponse: electron.IncomingMessage & NodeJS.ReadableStream): Buffer {
    if (!httpResponse.readable) {
        return new Buffer(0);
    }

    const bodyData: Array<number> = [];
    let buffer: Buffer;

    while (buffer = <Buffer>httpResponse.read()) {
        bodyData.push(...buffer);
    }

    return new Buffer(bodyData);
}

function handleRequestAsync(
    serverCertValidator: ServerCertValidator,
    pipeline: IHttpPipeline,
    request: IHttpRequest): Promise<IHttpResponse> {
    return new Promise((resolve, reject) => {
        const session = electron.Session.fromPartition(uuidv4(), {
            cache: false
        });

        if (serverCertValidator) {
            session.setCertificateVerifyProc((request, callback) => {
                if (serverCertValidator(request.hostname, toCertificateInfo(request.certificate))) {
                    callback(0);
                    return;
                }

                callback(-2);
            });
        }

        session.allowNTLMCredentialsForDomains("*");
        session.webRequest.onErrorOccurred((details) => {
            if (details.error === "net::ERR_SSL_CLIENT_AUTH_CERT_NEEDED") {
                resolve({
                    httpVersion: "1.1",
                    statusCode: 403,
                    statusMessage: "Client certificate required",
                    data: undefined,
                    headers: [],
                    body: undefined
                });
                return;
            }

            reject(new Error(details.error));
        });

        const options: any = Object.assign(Object.create(null), new URL(request.url));
        let httpRequest: electron.ClientRequest;
        let body: string | Buffer;

        if (Buffer.isBuffer(request.body) || typeof request.body === "string") {
            body = request.body;

        } else {
            body = JSON.stringify(request.body);

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
        options.session = session;
        options.redirect = "manual";

        if (request.headers) {
            options.headers = Object.create(null);
            applyHeaders(options.headers, request.headers);
        }

        httpRequest = electron.net.request(options);

        httpRequest.on("response", (response: electron.IncomingMessage & NodeJS.ReadableStream) => {
            const httpResponse: IHttpResponse = Object.create(null);

            httpResponse.httpVersion = response.httpVersion;
            httpResponse.statusCode = response.statusCode;
            httpResponse.statusMessage = response.statusMessage;
            httpResponse.headers = generateHeaders(response.headers);
            httpResponse.body = generateBody(response);

            resolve(httpResponse);
        });

        httpRequest.on("error", (error) => reject(error));

        if (body) {
            httpRequest.write(body);
        }

        httpRequest.end();
    });
}

function principalToString(principal: electron.CertificatePrincipal): string {
    let str = "";

    if (principal.commonName) {
        str += `CN=${principal.commonName}`;
    }

    if (principal.organizationUnits) {
        str += ", OU=" + principal.organizationUnits.join(", OU=");
    }

    if (principal.organizations) {
        str += ", O=" + principal.organizations.join(", O=");
    }

    if (principal.locality) {
        str += `, L=${principal.locality}`;
    }

    if (principal.state) {
        str += `, ST=${principal.state}`;
    }

    if (principal.country) {
        str += `, C=${principal.country}`;
    }

    return str;
}


function toCertificateInfo(cert: electron.Certificate): ICertificateInfo {
    const sha1 = crypto.createHash("sha1");

    sha1.update(cert.data);

    return {
        subjectName: principalToString(cert.subject),
        issuerName: principalToString(cert.issuer),
        serialNumber: cert.serialNumber,
        validStart: new Date(cert.validStart),
        validExpiry: new Date(cert.validExpiry),
        thumbprint: sha1.digest("hex")
    };
}

export default function createRequestHandler(serverCertValidator?: ServerCertValidator): HttpRequestHandler {
    if (serverCertValidator) {
        return handleRequestAsync.bind(undefined, serverCertValidator);
    }

    return handleRequestAsync.bind(undefined, undefined);
}
