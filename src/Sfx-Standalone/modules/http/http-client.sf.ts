/-----------------------------------------------------------------------------
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

    private readonly trustedCerts: Donuts.IStringKeyDictionary<boolean>;

    constructor(log: Donuts.Logging.ILog, pkiSvc: IPkiCertificateService) {
        super(log, [], []);

        this.trustedCerts = Object.create(null);

        const certResponseHandler = createAuthCertResponseHandler(pkiSvc, this.selectClientCertAsync);

        this.requestHandlers.push(
            certResponseHandler.httpRequestHandler,
            createRouterRequestHandler(
                this.checkServerCert,
                {
                    agents: {
                        http: new HttpAgent({ keepAlive: true }),
                        https: new HttpsAgent({ keepAlive: true })
                    }
                }));

        this.responseHandlers.push(
            createAuthAadResponseHandler(),
            certResponseHandler,
            createAuthWindowsResponseHandler(),
            createRedirectionResponseHandler(),
            createJsonResponseHandler(),
            createJsonFileResponseHandler());
    }

    private checkServerCert = (serverName: string, cert: ICertificateInfo): boolean => {
        const record = this.trustedCerts[cert.thumbprint];

        if (typeof record === "boolean") {
            return record;
        }

        const response = dialog.showMessageBox(
            BrowserWindow.getFocusedWindow(),
            {
                type: "warning",
                buttons: ["Yes", "No"],
                title: "Untrusted certificate",
                message: "Do you want to trust this certificate?",
                detail:
                    `Site: ${serverName} \r\n` +
                    `Subject: ${cert.subjectName}\r\n` +
                    `Issuer: ${cert.issuerName}\r\n` +
                    `Serial: ${cert.serialNumber}\r\n` +
                    `Starts: ${cert.validStart.toLocaleString()}\r\n` +
                    `Util: ${cert.validExpiry.toLocaleString()}\r\n` +
                    `Thumbprint: ${cert.thumbprint}`,
                cancelId: 1,
                defaultId: 0,
                noLink: true,
            });

        return this.trustedCerts[cert.thumbprint] = response === 0;
    }

    private selectClientCertAsync =
        async (urlString: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo> => {
            const prompt = await sfxModuleManager.getComponentAsync("prompt.select-certificate", certInfos);

            return await prompt.openAsync();
        }
}