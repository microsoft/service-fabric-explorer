//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    HttpResponseHandler
} from "sfx.http";

function getJsonHeader(response: IHttpResponse): string {
    const jsonHeader =
        response.headers.find(
            (header) => header.name === "Content-Type" && header.value.includes("application/json"));

    return jsonHeader ? jsonHeader.value : undefined;
}

const Regex_Charset = /charset\=([a-zA-Z\-_0-9]+)/i;

function getEncoding(jsonHeader: string): string {
    const matches = Regex_Charset.exec(jsonHeader);

    if (!matches) {
        return "utf8";
    } else {
        switch (matches[1]) {
            case "usascii":
            case "ascii":
                return "ascii";

            case "utf8":
            case "utf-8":
                return "utf8";

            case "utf16":
            case "utf-16":

            case "utf16le":
            case "utf-16le":

            case "ucs2":
            case "ucs-2":
                return "utf16le";

            default:
                return undefined;
        }
    }
}

async function handleResponseAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    let jsonHeader: string;

    if (response.statusCode >= 300 || !(jsonHeader = getJsonHeader(response))) {
        return undefined;
    }

    const encoding = getEncoding(jsonHeader);

    if (!encoding) {
        return undefined;
    }

    response.data = JSON.parse(response.body.toString(encoding));

    return undefined;
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync;
}
