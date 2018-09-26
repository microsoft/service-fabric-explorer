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
import { IDictionary } from "sfx.common";

interface ISfAadMetadata {
    type: string;
    metadata: {
        authority: string;
        client: string;
        cluster: string;
        login: string;
        redirect: string;
        tenant: string;
    };
}

async function acquireTokenAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    const aadMetadataResponse = await pipeline.requestAsync(
        {
            method: "GET",
            url: url.resolve(request.url, "/$/GetAadMetadata?api-version=1.0")
        });

    if (aadMetadataResponse.statusCode !== 200) {
        return undefined;
    }

    const aadMetadata: ISfAadMetadata = aadMetadataResponse.data;

    if (aadMetadata.type !== "aad") {
        return undefined;
    }

    return await handleAadAsync(
        {
            authority: aadMetadata.metadata.authority,
            redirectUri: url.resolve(request.url, "/Explorer/index.html"),
            clientId: aadMetadata.metadata.cluster
        },
        pipeline,
        request,
        response);
}

const siteMap: IDictionary<Promise<IHttpResponse>> = Object.create(null);

function handleResponseAsync(pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 401 && response.statusCode !== 403) {
        return undefined;
    }

    const siteId = url.parse(request.url).host;

    if (!request.headers.find((header) => header.name === "Authorization")) {
        const record = siteMap[siteId];

        if (record instanceof Promise) {
            return record.then(() => pipeline.requestAsync(request));
        } else if (record === null) {
            return pipeline.requestAsync(request);
        }
    }

    const tokenPromise = siteMap[siteId] = acquireTokenAsync(pipeline, request, response);

    tokenPromise.then(() => siteMap[siteId] = null);

    return tokenPromise;
}

export default function createResponseHandler(): HttpResponseHandler {
    return handleResponseAsync;
}
