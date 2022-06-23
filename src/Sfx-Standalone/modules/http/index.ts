//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient, HttpRequestHandler, HttpResponseHandler } from "sfx.http";
import { IPkiCertificateService } from "sfx.cert";

import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components
        .register<IHttpClient>({
            name: "http-client",
            version: shell.getAppVersion(),
            descriptor: (log: Donuts.Logging.ILog, requestHandlers?: Array<HttpRequestHandler>, responseHandlers?: Array<HttpResponseHandler>): Promise<IHttpClient> =>
                Promise.resolve(new (require("./http-client").default)(log, requestHandlers, responseHandlers)),
            deps: ["logging.default"]
        })

        .register<IHttpClient>({
            name: "http-client.service-fabric",
            version: shell.getAppVersion(),
            descriptor: (log: Donuts.Logging.ILog, pkiSvc: IPkiCertificateService): Promise<IHttpClient> =>
                Promise.resolve(new (require("./http-client.sf").default)(log, pkiSvc)),
            deps: ["logging.default", "cert.pki-service"]
        });

    return {
        name: "http",
        version: shell.getAppVersion()
    };
};