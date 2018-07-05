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

function isJsonResponse(log: ILog, response: IHttpResponse): boolean {
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

        log.writeVerbose(`Treat Content-Type (${contentType}) as JSON since Content-Disposition header (${contentDisposition}) indicates JSON extension.`);
        return true;
    }

    return false;
}

export default function handleJson(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
    return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        if (response.statusCode >= 200 && response.statusCode < 300 && isJsonResponse(log, response)) {
            response.setEncoding("utf8");

            return new Promise((resolve, reject) => {
                let json: string = "";

                response.on("data", (chunk) => json += chunk);
                response.on("end", () => {
                    try {
                        resolve(JSON.parse(json));
                    } catch (exception) {
                        reject(exception);
                    }
                });
            });
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
