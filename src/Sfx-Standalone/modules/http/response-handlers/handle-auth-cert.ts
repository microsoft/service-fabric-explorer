//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpClient,
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpResponse
} from "sfx.http";

import { SelectClientCertAsyncHandler } from "sfx.http.auth";
import { ILog } from "sfx.logging";

import {
    IPkiCertificateService,
    ICertificateInfo,
    ICertificateLoader,
    ICertificate
} from "sfx.cert";

function isCertificateInfo(cert: any): cert is ICertificateInfo {
    return cert && String.isString(cert.thumbprint);
}

function isCertificate(cert: any): cert is ICertificate {
    return cert && String.isString(cert.type);
}

export default function handleCertAsync(
    certLoader: ICertificateLoader,
    pkiCertSvc: IPkiCertificateService,
    selectClientCertAsyncHandler: SelectClientCertAsyncHandler,
    nextHandler: ResponseAsyncHandler): ResponseAsyncHandler {
    const HttpMsg_ClientCertRequired = "Client certificate required";

    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        if (response.statusCode === 403
            && 0 === HttpMsg_ClientCertRequired.localeCompare(response.statusMessage, undefined, { sensitivity: "accent" })) {

            log.writeInfo("Client certificate is required.");

            const validCertInfos = (await pkiCertSvc.getCertificateInfosAsync("My")).filter((certInfo) => certInfo.hasPrivateKey);
            let selectedCert = await selectClientCertAsyncHandler(requestOptions.url, validCertInfos);

            if (isCertificateInfo(selectedCert)) {
                log.writeInfo(`Client certificate (thumbprint:${selectedCert.thumbprint}) is selected.`);
                selectedCert = await pkiCertSvc.getCertificateAsync(selectedCert);
            } else if (isCertificate(selectedCert)) {
                log.writeInfo(`Custom client certificate (type: ${selectedCert.type}) is selected.`);
                selectedCert = await certLoader.loadAsync(selectedCert);
            } else {
                throw new Error(`Invalid client certificate: ${JSON.stringify(selectedCert, null, 4)}`);
            }

            const clientRequestOptions = await client.defaultRequestOptions;

            clientRequestOptions.clientCert = selectedCert;

            await client.updateDefaultRequestOptionsAsync(clientRequestOptions);

            log.writeInfo("Re-sending the HTTPS request ...");
            return client.requestAsync(requestOptions, requestData);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return response;
    };
}
