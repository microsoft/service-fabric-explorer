//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ClientCertSelector, ServerCertValidator } from "sfx.http";
import { IPkiCertificateService } from "sfx.cert";

import HttpClient from "./http-client";

import createNodeRequestHandler from "./request-handlers/node";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";
import createJsonFileResponseHandler from "./response-handlers/json-file";
import createAuthCertResponseHandler from "./response-handlers/auth.cert";
import createAuthAadResponseHandler from "./response-handlers/auth.aad.sf";
import createAuthWindowsResponseHandler from "./response-handlers/auth.windows";

export default class ServiceFabricHttpClient extends HttpClient {
    constructor(serverCertValidator: ServerCertValidator, pkiSvc: IPkiCertificateService, clientCertSelector: ClientCertSelector) {
        super([], []);

        this.requestHandlers.push(createNodeRequestHandler(serverCertValidator));

        this.responseHandlers.push(
            createAuthAadResponseHandler(),
            createAuthCertResponseHandler(pkiSvc, clientCertSelector),
            createAuthWindowsResponseHandler(),
            createRedirectionResponseHandler(),
            createJsonResponseHandler(),
            createJsonFileResponseHandler());
    }
}
