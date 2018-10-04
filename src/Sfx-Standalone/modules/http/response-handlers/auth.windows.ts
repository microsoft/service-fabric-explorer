//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    HttpResponseHandler,
    HttpRequestHandler
} from "sfx.http";

import createRequestHandler from "../request-handlers/electron";

async function handleResponseAsync(handleRequestAsync: HttpRequestHandler, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 401
        || !response.headers.find((header) => header.name === "WWW-Authenticate" && (header.value === "NTLM" || header.value === "Negotiate"))) {
        return undefined;
    }

    const authenticatedResponse = await handleRequestAsync(pipeline, request);

    Object.assign(response, authenticatedResponse);

    return undefined;
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync.bind(undefined, createRequestHandler(() => true));
}
