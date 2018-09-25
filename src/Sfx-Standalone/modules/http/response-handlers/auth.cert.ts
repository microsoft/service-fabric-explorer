//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    HttpResponseHandler,
    ClientCertSelector
} from "sfx.http";

import {
    ICertificate,
    ICertificateInfo,
    IPkiCertificateService
} from "sfx.cert";

const StatusMsg_ClientCertRequired = "Client certificate required";

function isCertificateInfo(cert: any): cert is ICertificateInfo {
    return cert && String.isString(cert.thumbprint);
}

function isCertificate(cert: any): cert is ICertificate {
    return cert && String.isString(cert.type);
}

async function handleResponseAsync(pkiSvc: IPkiCertificateService, selectClientCert: ClientCertSelector, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 403
        || response.statusMessage !== StatusMsg_ClientCertRequired) {
        return undefined;
    }

    const certInfos = await pkiSvc.getCertificateInfosAsync("My");

    const selectedCertInfo = await selectClientCert(request.url, certInfos);
    let selectedCert: ICertificate;

    if (isCertificateInfo(selectedCertInfo)) {
        selectedCert = await pkiSvc.getCertificateAsync(selectedCertInfo);
    } else if (isCertificate(selectedCertInfo)) {
        selectedCert = selectedCertInfo;
    } else {
        return undefined;
    }

    if (!pipeline.requestTemplate) {
        pipeline.requestTemplate = Object.create(null);
    }

    pipeline.requestTemplate.clientCert = selectedCert;

    return pipeline.requestAsync(request);
}

export default function createResponseHandler(pkiSvc: IPkiCertificateService, clientCertSelector: ClientCertSelector): HttpResponseHandler {
    if (!Function.isFunction(clientCertSelector)) {
        throw new Error("A valid clientCertSelector function must be supplied.");
    }

    return handleResponseAsync.bind(undefined, pkiSvc, clientCertSelector);
}
