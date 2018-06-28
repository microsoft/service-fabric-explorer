//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ResponseAsyncHandler, IRequestOptions } from "sfx.http";
import { ILog } from "sfx.logging";

import { IncomingMessage } from "http";

const HttpMsg_ClientCertRequired = "Client certificate required";

export function handleCert(nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
    return (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage): Promise<any> => {
        if (response.statusCode === 403
            && 0 === HttpMsg_ClientCertRequired.localeCompare(response.statusMessage, undefined, { sensitivity: "accent" })) {

        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);;
    }
}

import * as child_process from "child_process";

console.log(child_process.execSync("powershell \"ConvertTo-Json (Get-ChildItem cert:\\CurrentUser\\My | Select -Property Thumbprint)\"", { encoding: "utf8" }));
