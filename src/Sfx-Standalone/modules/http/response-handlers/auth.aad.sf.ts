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

import { handleResponseAsync as handleAadAsync } from "./auth.aad";

import * as url from "url";

interface ISfAadMetadata {
    type: string;
    authority: string;
    client: string;
    cluster: string;
    login: string;
    redirect: string;
    tenant: string;
}

async function handleResponseAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 401 && response.statusCode !== 403) {
        return undefined;
    }

    const aadMetadataResponse = await pipeline.requestAsync(
        {
            method: "GET",
            url: url.resolve(request.url, "/$/GetAadMetadata?api-version=1.0")
        });

    if (aadMetadataResponse.statusCode !== 200) {
        return undefined;
    }

    const aadMetadata: ISfAadMetadata = aadMetadataResponse.result;

    if (aadMetadata.type !== "aad") {
        return undefined;
    }

    return await handleAadAsync(
        {
            authority: aadMetadata.authority,
            redirectUri: url.resolve(request.url, "/Explorer/index.html"),
            clientId: aadMetadata.cluster
        }, 
        pipeline, 
        request, 
        response);
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync;
}
