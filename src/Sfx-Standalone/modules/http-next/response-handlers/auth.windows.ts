//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    IHttpHeader,
    HttpResponseHandler
} from "sfx.http-next";

import * as uuidv4 from "uuid/v4"
import * as electron from "electron";

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

function handleResponseAsync(session: electron.session, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 401
        || !response.headers.find((header) => header.name === "WWW-Authenticate" && (header.value === "NTLM" || header.value === "Negotiate"))) {
        return Promise.resolve(undefined);
    }

    return new Promise((resolve, reject) => {
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

export = createResponseHandler;
function createResponseHandler(): HttpResponseHandler {
    const session = electron.Session.fromPartition(uuidv4(), {
        cache: false
    });

    session.setCertificateVerifyProc((request, callback) => callback(0));
    session.allowNTLMCredentialsForDomains("*");

    return handleResponseAsync.bind(session);
}
