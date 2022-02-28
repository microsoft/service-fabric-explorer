//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPkiCertificateService, ICertificateInfo, ICertificate } from "sfx.cert";

import { dialog, BrowserWindow } from "electron";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

import HttpClient from "./http-client";

import createRouterRequestHandler from "./request-handlers/router";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";
import createJsonFileResponseHandler from "./response-handlers/json-file";
import createAuthCertResponseHandler from "./response-handlers/auth.cert";
import createAuthAadResponseHandler from "./response-handlers/auth.aad.sf";
import createAuthWindowsResponseHandler from "./response-handlers/auth.windows";

export default class ServiceFabricHttpClient extends HttpClient {
    
    constructor(log: Donuts.Logging.ILog, pkiSvc: IPkiCertificateService) {
        super(log, [], []);

        const selectCert = () => {
            const clusterAuthenticationMap = this.clusterAuthenticationMap;
            const selectClientCertAsync =
            async (urlString: string): Promise<string> => {
                return clusterAuthenticationMap[urlString];
            }

            return selectClientCertAsync;
        }

        const certResponseHandler = createAuthCertResponseHandler(pkiSvc, selectCert());

        this.requestHandlers.push(
            certResponseHandler.httpRequestHandler,
            createRouterRequestHandler(
                this.checkServerCert,
                {
                    agents: {
                        http: new HttpAgent({ keepAlive: true }),
                        https: new HttpsAgent({ keepAlive: true })
                    }
                })
                );

        this.responseHandlers.push(
            createAuthAadResponseHandler(),
            certResponseHandler,
            createAuthWindowsResponseHandler(),
            createRedirectionResponseHandler(),
            createJsonResponseHandler(),
            createJsonFileResponseHandler());
    }

    private checkServerCert = (serverName: string, cert: ICertificateInfo): boolean => {
        return true;
    }

}
