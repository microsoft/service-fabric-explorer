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

import * as path from "path";

const Regex_FileName = /filename\=([^\\/\:\*\?\"\<\>\|]+)\;?/i;

function isJsonFile(response: IHttpResponse): boolean {
    const contentDispositionHeader = response.headers.find((header) => header.name === "Content-Disposition");

    if (!contentDispositionHeader) {
        return undefined;
    }

    const match = Regex_FileName.exec(contentDispositionHeader.value);

    if (!match) {
        return undefined;
    }

    return 0 === ".json".localeCompare(path.extname(match[1]), undefined, { sensitivity: "base" });
}

async function handleResponseAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode >= 300 || !isJsonFile(response)) {
        return undefined;
    }

    if (response.body.length <= 0) {
        response.data = undefined;
        return undefined;
    }

    response.data = JSON.parse(response.body.toString("utf8"));

    return undefined;
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync;
}
