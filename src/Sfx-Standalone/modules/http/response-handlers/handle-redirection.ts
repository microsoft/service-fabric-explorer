//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpClient,
    IHttpResponse
} from "sfx.http";

import { ILog } from "sfx.logging";

export default function handleRedirection(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
    return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        if (response.statusCode === 301
            || response.statusCode === 302
            || response.statusCode === 307
            || response.statusCode === 308) {
            const location = response.headers["location"];
            const redirectionRequestOptions: IRequestOptions = JSON.parse(JSON.stringify(requestOptions));

            redirectionRequestOptions.url = location;
            log.writeInfo("HTTP{}: Redirecting to {}", response.statusCode, redirectionRequestOptions.url);

            return client.requestAsync(redirectionRequestOptions, requestData);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
