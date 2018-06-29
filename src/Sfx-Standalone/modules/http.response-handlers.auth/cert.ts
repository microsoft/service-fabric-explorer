//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ResponseAsyncHandler, IRequestOptions } from "sfx.http";
import { SelectClientCertAsyncHandler } from "sfx.http.response-handlers.auth";
import { ILog } from "sfx.logging";

import * as fs from "fs";
import { exec } from "child_process";
import { IncomingMessage } from "http";

import { local } from "../../utilities/appUtils";
import { env, Platform } from "../../utilities/env";

namespace Windows {
    const GetValidCertificatesPs1 = local("./Get-ValidCertificates.ps1");
    const GetPfxCertificateDataPs1 = local("./Get-PfxCertificateData.ps1");

    export function getValidCertsAsync(): Promise<Array<ICertificate>> {
        return new Promise<string>(
            (resolve, reject) =>
                exec(`powershell "${GetValidCertificatesPs1}"`,
                    { encoding: "utf8" },
                    (error, stdout) => error ? reject(error) : resolve(stdout)))
            .then((jsonString) => {
                const certs = JSON.parse(jsonString);

                for (const cert of certs) {
                    cert.validExpiry = new Date(cert.validExpiry);
                    cert.validStart = new Date(cert.validStart);
                }

                return certs;
            });
    }

    export function getPfxCertDataByThumbprintAsync(thumbprint: string): Promise<Buffer> {
        return new Promise<string>(
            (resolve, reject) =>
                exec(`powershell "${GetPfxCertificateDataPs1}" -Thumbprint ${thumbprint}`,
                    { encoding: "utf8" },
                    (error, stdout) => error ? reject(error) : resolve(stdout)))
            .then((jsonString) => Buffer.from(jsonString, "base64"));
    }
}

export function handleCert(nextHandler: ResponseAsyncHandler, selectClientCertAsyncHandler: SelectClientCertAsyncHandler): ResponseAsyncHandler {
    const HttpMsg_ClientCertRequired = "Client certificate required";

    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage): Promise<any> => {
        if (response.statusCode === 403
            && 0 === HttpMsg_ClientCertRequired.localeCompare(response.statusMessage, undefined, { sensitivity: "accent" })) {

            let validCerts: Array<ICertificate> = undefined;

            if (env.platform === Platform.Windows) {
                validCerts = await Windows.getValidCertsAsync();
            }

            const selectedCert = await selectClientCertAsyncHandler(requestOptions.url, validCerts);
            let certData: Buffer;

            if (selectedCert instanceof Buffer) {
                certData = selectedCert;
            } else {
                certData = await Windows.getPfxCertDataByThumbprintAsync(selectedCert.thumbprint);
            }

            const clientRequestOptions = client.defaultRequestOptions;

            clientRequestOptions.clientCert = <IPfxClientCertificate>{
                type: "pfx",
                pfx: certData,
                password: ""
            };

            client.updateDefaultRequestOptions(clientRequestOptions);

            return client.requestAsync(requestOptions, requestData);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
