//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, ResponseAsyncHandler, IRequestOptions } from "sfx.http";
import { SelectClientCertAsyncHandler } from "sfx.http.auth";
import { ILog } from "sfx.logging";
import { IPkiCertificateService, ICertificateInfo, ICertificateLoader } from "sfx.cert";

import { IncomingMessage } from "http";

function isCertificateInfo(cert: any): cert is ICertificateInfo {
    return cert && String.isString(cert.thumbprint);
}

export default function handleCert(
    certLoader: ICertificateLoader,
    pkiCertSvc: IPkiCertificateService,
    nextHandler: ResponseAsyncHandler,
    selectClientCertAsyncHandler: SelectClientCertAsyncHandler): ResponseAsyncHandler {
    const HttpMsg_ClientCertRequired = "Client certificate required";

    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IncomingMessage): Promise<any> => {
        if (response.statusCode === 403
            && 0 === HttpMsg_ClientCertRequired.localeCompare(response.statusMessage, undefined, { sensitivity: "accent" })) {

            log.writeInfo("Client certificate is required.");

            const validCertInfos = pkiCertSvc.getCertificateInfos("My").filter((certInfo) => certInfo.hasPrivateKey);
            let selectedCert = await selectClientCertAsyncHandler(requestOptions.url, validCertInfos);

            if (isCertificateInfo(selectedCert)) {
                log.writeInfo(`Client certificate (thumbprint:${selectedCert.thumbprint}) is selected.`);
                selectedCert = pkiCertSvc.getCertificate(selectedCert);
            } else {
                log.writeInfo(`Custom client certificate (type: ${selectedCert.type}) is selected.`);
                selectedCert = certLoader.load(selectedCert);
            }

            const clientRequestOptions = client.defaultRequestOptions;

            clientRequestOptions.clientCert = selectedCert;

            client.updateDefaultRequestOptions(clientRequestOptions);

            log.writeInfo("Re-sending the HTTPS request ...");
            return client.requestAsync(requestOptions, requestData);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
