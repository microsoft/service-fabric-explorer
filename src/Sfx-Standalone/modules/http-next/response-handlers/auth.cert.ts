//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    HttpResponseHandler,
    ClientCertSelector,
    HttpRequestHandler
} from "sfx.http-next";

import { ICertificate, ICertificateInfo } from "sfx.cert";

import createRequestHandler from "../request-handlers/node";

const StatusMsg_ClientCertRequired = "Client certificate required";

function isCertificateInfo(cert: any): cert is ICertificateInfo {
    return cert && String.isString(cert.thumbprint);
}

function isCertificate(cert: any): cert is ICertificate {
    return cert && String.isString(cert.type);
}

async function handleResponseAsync(handleRequestAsync: HttpRequestHandler, selectClientCert: ClientCertSelector, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 403
        || response.statusMessage !== StatusMsg_ClientCertRequired) {
        return undefined;
    }

    const pkiSvc = await sfxModuleManager.getComponentAsync("cert.pki-service");
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

    return handleRequestAsync(pipeline, request);
}

export default function createResponseHandler(clientCertSelector: ClientCertSelector): HttpResponseHandler {
    if (!Function.isFunction(clientCertSelector)) {
        throw new Error("A valid clientCertSelector function must be supplied.");
    }

    return handleResponseAsync.bind(undefined, createRequestHandler(() => Promise.resolve(true)), clientCertSelector);
}
