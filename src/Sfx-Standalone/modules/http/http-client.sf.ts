//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IPkiCertificateService, ICertificateInfo, ICertificate } from "sfx.cert";

import { dialog, BrowserWindow } from "electron";
import * as url from "url";

import HttpClient from "./http-client";

import createRouterRequestHandler from "./request-handlers/router";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";
import createJsonFileResponseHandler from "./response-handlers/json-file";
import createAuthCertResponseHandler from "./response-handlers/auth.cert";
import createAuthAadResponseHandler from "./response-handlers/auth.aad.sf";
import createAuthWindowsResponseHandler from "./response-handlers/auth.windows";

export default class ServiceFabricHttpClient extends HttpClient {

    private readonly trustedCerts: IDictionary<boolean>;
    private readonly clientCertMap: IDictionary<Promise<ICertificate | ICertificateInfo>>;

    constructor(log: Donuts.Logging.ILog, pkiSvc: IPkiCertificateService) {
        super(log, [], []);

        this.clientCertMap = Object.create(null);
        this.trustedCerts = Object.create(null);

        this.requestHandlers.push(createRouterRequestHandler(this.checkServerCert));

        this.responseHandlers.push(
            createAuthAadResponseHandler(),
            createAuthCertResponseHandler(pkiSvc, this.selectClientCertAsync),
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
        (urlString: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo> => {
            const siteId = url.parse(urlString).host;
            const record = this.clientCertMap[siteId];

            if (record instanceof Promise) {
                console.log("return existing promise");
                return record;
            }

            this.clientCertMap[siteId] = new Promise<ICertificate | ICertificateInfo>((resolve, reject) => {
                const promptPromise = sfxModuleManager.getComponentAsync("prompt.select-certificate", certInfos);

                promptPromise
                    .then((prompt) => prompt.openAsync())
                    .then((selectedCert) => resolve(selectedCert || undefined), (err) => reject(err))
                    .then(() => promptPromise)
                    .then((prompt) => prompt.disposeAsync());
            });

            this.clientCertMap[siteId].then(() => delete this.clientCertMap[siteId]);

            console.log("return new promise for ", siteId, "cert map count:", this.clientCertMap);

            return this.clientCertMap[siteId];
        }
}
