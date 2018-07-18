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

export default async function handleRedirectionAsync(nextHandler: ResponseAsyncHandler): Promise<ResponseAsyncHandler> {
    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        const statusCode = await response.statusCode;
        
        if (statusCode === 301
            || statusCode === 302
            || statusCode === 307
            || statusCode === 308) {
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
