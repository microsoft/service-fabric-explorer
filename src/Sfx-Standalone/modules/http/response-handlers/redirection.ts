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

function getLocationHeader(response: IHttpResponse): string {
    const locationHeader =
        response.headers.find(
            (header) => header.name === "Location");

    return locationHeader ? locationHeader.value : undefined;
}

const RedirectionCodes = [301, 302, 303, 307, 308];

function handleResponseAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (!RedirectionCodes.includes(response.statusCode)) {
        return undefined;
    }

    const location = getLocationHeader(response);

    if (location) {
        return pipeline.requestAsync(Object.assign(Object.create(null), request, { url: location }));
    }

    return undefined;
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync;
}
