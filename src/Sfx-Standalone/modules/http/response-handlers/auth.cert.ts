//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IHttpPipeline,
    IHttpRequest,
    IHttpResponse,
    ClientCertSelector,
    HttpRequestHandler
} from "sfx.http";

import {
    ICertificate,
    ICertificateInfo,
    IPkiCertificateService
} from "sfx.cert";

import * as utils from "donuts.node/utils";

interface HttpCertAuthResponseHandler {
    (pipleline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse>;

    httpRequestHandler: HttpRequestHandler;
}

interface IContext {
    certDictionary: Donuts.IStringKeyDictionary<ICertificate | Promise<ICertificate>>;
}

const StatusMsg_ClientCertRequired = "Client certificate required";

function isCertificateInfo(cert: any): cert is ICertificateInfo {
    return cert && utils.isString(cert.thumbprint);
}

function isCertificate(cert: any): cert is ICertificate {
    return cert && utils.isString(cert.type);
}

async function handleRequestAsync(this: IContext, pipleline: IHttpPipeline, request: IHttpRequest): Promise<IHttpResponse> {
    if (request.clientCert) {
        return undefined;
    }

    const url = new URL(request.url);
    const certObj = this.certDictionary[url.host];

    if (!certObj) {
        return undefined;
    }

    if (certObj instanceof Promise) {
        request.clientCert = await certObj;

    } else {
        request.clientCert = certObj;
    }

    return undefined;
}

async function getCertAsync(pkiSvc: IPkiCertificateService, selectClientCert: ClientCertSelector, url: string): Promise<ICertificate> {
    const selectedCertInfo = await selectClientCert(url, []);
    let selectedCert: ICertificate;

    selectedCert = await pkiSvc.getCertificateAsync(selectedCertInfo);


    return selectedCert;
}

async function handleResponseAsync(this: IContext, pkiSvc: IPkiCertificateService, selectClientCert: ClientCertSelector, pipeline: IHttpPipeline, request: IHttpRequest, response: IHttpResponse): Promise<IHttpResponse> {
    if (response.statusCode !== 403
        || response.statusMessage !== StatusMsg_ClientCertRequired) {
        return undefined;
    }

    const host = new URL(request.url).host;
    const certObj = this.certDictionary[host];
    let getCertPromise: Promise<ICertificate>;

    if (certObj) {
        if (certObj instanceof Promise) {
            getCertPromise = certObj;

        } else if (certObj !== request.clientCert) {
            request.clientCert = certObj;

            return pipeline.requestAsync(request);
        }
    }

    if (!getCertPromise) {
        getCertPromise = getCertAsync(pkiSvc, selectClientCert, request.url);

        getCertPromise.then((cert) => {
            if (cert) {
                this.certDictionary[host] = cert;

            } else {
                delete this.certDictionary[host];
            }
        });

        this.certDictionary[host] = getCertPromise;
    }

    const cert = await getCertPromise;

    if (!cert) {
        return undefined;
    }

    request.clientCert = cert;

    return pipeline.requestAsync(request);
}

export default function createResponseHandler(pkiSvc: IPkiCertificateService, clientCertSelector: ClientCertSelector): HttpCertAuthResponseHandler {
    if (!utils.isFunction(clientCertSelector)) {
        throw new Error("A valid clientCertSelector function must be supplied.");
    }

    const context: IContext = Object.create(null);

    context.certDictionary = Object.create(null);

    const handler: HttpCertAuthResponseHandler = handleResponseAsync.bind(context, pkiSvc, clientCertSelector);

    handler.httpRequestHandler = handleRequestAsync.bind(context);

    return handler;
}
