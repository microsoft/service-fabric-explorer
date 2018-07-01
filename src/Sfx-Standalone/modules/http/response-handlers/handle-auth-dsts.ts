//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ResponseAsyncHandler, IRequestOptions } from "sfx.http";
import { ILog } from "sfx.logging";

import { IncomingMessage } from "http";

export default function handleDSts(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
    return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage): Promise<any> => {
        return Promise.resolve();
    };
}
