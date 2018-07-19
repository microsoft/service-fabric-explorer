//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog } from "sfx.logging";
import {
    ResponseAsyncHandler,
    IHttpClient,
    IRequestOptions,
    IHttpResponse
} from "sfx.http";

import { HttpContentTypes } from "../common";

function isJsonResponse(log: ILog, response: IHttpResponse<any>): boolean {
    const regex_filename_json = /filename=.+\.json/i;

    const contentType = response.headers["content-type"];
    const contentDisposition = response.headers["content-disposition"];

    if (!String.isString(contentType)) {
        return false;
    }

    if (contentType.indexOf(HttpContentTypes.json) >= 0) {
        return true;
    }

    if (contentType.indexOf(HttpContentTypes.binary) >= 0
        && regex_filename_json.test(contentDisposition)) {

        log.writeVerboseAsync(`Treat Content-Type (${contentType}) as JSON since Content-Disposition header (${contentDisposition}) indicates JSON extension.`);
        return true;
    }

    return false;
}

export default async function handleJsonAsync(nextHandler: ResponseAsyncHandler): Promise<ResponseAsyncHandler> {
    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse<any>): Promise<any> => {
        const statusCode = await response.statusCode;
        if (statusCode >= 200 && statusCode < 300 && isJsonResponse(log, response)) {
            await response.setEncodingAsync("utf8");

            let chunk: string;
            let json: string = "";

            while (chunk = await <Promise<string>>response.readAsync()) {
                json += chunk;
            }

            return JSON.parse(json);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
