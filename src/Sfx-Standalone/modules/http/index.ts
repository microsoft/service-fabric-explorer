//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";
import { ILog } from "sfx.logging";
import { ICertificateLoader, IPkiCertificateService } from "sfx.cert";
import { IHttpClient } from "sfx.http";

import * as appUtils from "../../utilities/appUtils";

import { HttpProtocols } from "./common";
import handleJsonRequest from "./request-handlers/handle-json";
import handleJsonResponse from "./response-handlers/handle-json";
import handleRedirectionResponse from "./response-handlers/handle-redirection";
import handleAuthAadResponse from "./response-handlers/handle-auth-aad";
import handleAuthCertResponse from "./response-handlers/handle-auth-cert";
import handleAuthDStsResponse from "./response-handlers/handle-auth-dsts";
import { HttpClientBuilder } from "./node.http-client-builder";

function buildNodeHttpClient(log: ILog, certLoader: ICertificateLoader, protocol: string): IHttpClient {
    const clientBuilder = new HttpClientBuilder(log, certLoader);

    // Request handlers
    clientBuilder.handleRequest(handleJsonRequest);

    // Response handlers
    clientBuilder
        .handleResponse(handleRedirectionResponse)
        .handleResponse(handleJsonResponse);

    return clientBuilder.build(protocol);
}

function buildElectronHttpClient(log: ILog, certLoader: ICertificateLoader, protocol: string): IHttpClient {
    throw new Error("Not implemented!");
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "http.http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildNodeHttpClient(log, certLoader, HttpProtocols.any),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildNodeHttpClient(log, certLoader, HttpProtocols.https),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.node-http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildNodeHttpClient(log, certLoader, HttpProtocols.any),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.node-https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildNodeHttpClient(log, certLoader, HttpProtocols.https),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.electron-http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildElectronHttpClient(log, certLoader, HttpProtocols.any),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.electron-https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildElectronHttpClient(log, certLoader, HttpProtocols.https),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.client-builder",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => new HttpClientBuilder(log, certLoader),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.node-client-builder",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => new HttpClientBuilder(log, certLoader),
                deps: ["logging", "cert.cert-loader"]
            },

            // Request Handlers
            {
                name: "http.request-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: () => handleJsonRequest
            },

            // Response Handlers
            {
                name: "http.response-handlers.handle-redirection",
                version: appUtils.getAppVersion(),
                descriptor: () => handleRedirectionResponse
            },
            {
                name: "http.response-handlers.handle-json",
                version: appUtils.getAppVersion(),
                descriptor: () => handleJsonResponse
            },
            {
                name: "http.response-handlers.handle-auth-aad",
                version: appUtils.getAppVersion(),
                descriptor: () => handleAuthAadResponse
            },
            {
                name: "http.response-handlers.handle-auth-cert",
                version: appUtils.getAppVersion(),
                descriptor:
                    (certLoader: ICertificateLoader, pkiCertSvc: IPkiCertificateService) =>
                        handleAuthCertResponse.bind(null, certLoader, pkiCertSvc),
                deps: ["cert.cert-loader", "cert.pki-service"]
            },
            {
                name: "http.response-handlers.handle-auth-dsts",
                version: appUtils.getAppVersion(),
                descriptor: () => handleAuthDStsResponse
            }
        ]
    };
}
