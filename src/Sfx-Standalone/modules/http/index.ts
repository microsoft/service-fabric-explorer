//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo } from "sfx.module-manager";
import { ILog } from "sfx.logging";
import { ICertificateLoader } from "sfx.cert";
import { IHttpClient } from "sfx.http";

import * as appUtils from "../../utilities/appUtils";

import { HttpProtocols } from "./common";
import handleJsonRequest from "./request-handlers/handle-json";
import handleJsonResponse from "./response-handlers/handle-json";
import handleRedirectionResponse from "./response-handlers/handle-redirection";
import { HttpClientBuilder } from "./http-client-builder";

function buildHttpClient(log: ILog, certLoader: ICertificateLoader, protocol: string): IHttpClient {
    const clientBuilder = new HttpClientBuilder(log, certLoader);

    // Request handlers
    clientBuilder.handleRequest(handleJsonRequest);

    // Response handlers
    clientBuilder
        .handleResponse(handleRedirectionResponse)
        .handleResponse(handleJsonResponse);

    return clientBuilder.build(protocol);
}

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "http",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "http.http-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildHttpClient(log, certLoader, HttpProtocols.any),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.https-client",
                version: appUtils.getAppVersion(),
                descriptor: (log: ILog, certLoader: ICertificateLoader) => buildHttpClient(log, certLoader, HttpProtocols.https),
                deps: ["logging", "cert.cert-loader"]
            },
            {
                name: "http.client-builder",
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
        ]
    };
}
