//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    ServerCertValidator,
    HttpRequestHandler
} from "sfx.http";

import * as url from "url";

import createNodeRequestHandler from "./node";
import createElectronRequestHandler from "./electron";

function shouldTryOther(response: IHttpResponse): boolean {
    if (response.statusCode === 401
        && response.headers.find((header) => header.name === "WWW-Authenticate" && (header.value === "NTLM" || header.value === "Negotiate"))) {
        return true;
    }

    return false;
}

export default function createRequestHandler(serverCertValidator?: ServerCertValidator): HttpRequestHandler {
    const requestMap: IDictionary<HttpRequestHandler> = Object.create(null);
    const requestHandlers: Array<HttpRequestHandler> = [];

    requestHandlers.push(createNodeRequestHandler(serverCertValidator));
    requestHandlers.push(createElectronRequestHandler(serverCertValidator));

    return async (pipeline: IHttpPipeline, request: IHttpRequest): Promise<IHttpResponse> => {
        const urlHost = url.parse(request.url).host;

        let handleRequestAsync = requestMap[urlHost];
        let response: IHttpResponse;

        if (!handleRequestAsync) {
            handleRequestAsync = requestHandlers[0];
        }

        let requestHandlerIndex = 0;

        do {
            response = await handleRequestAsync(pipeline, request);

            if (!shouldTryOther(response)) {
                if (response.statusCode < 400) {
                    requestMap[urlHost] = handleRequestAsync;
                }

                break;
            }

            do {
                requestHandlerIndex++;
            } while (requestHandlers[requestHandlerIndex] === handleRequestAsync);

            handleRequestAsync = requestHandlers[requestHandlerIndex];

        } while (handleRequestAsync);

        return response;
    };
}
