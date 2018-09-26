//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IPkiCertificateService, ICertificateInfo, ICertificate } from "sfx.cert";

import { dialog } from "electron";
import * as url from "url";

import HttpClient from "./http-client";

import createNodeRequestHandler from "./request-handlers/node";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";
import createJsonFileResponseHandler from "./response-handlers/json-file";
import createAuthCertResponseHandler from "./response-handlers/auth.cert";
//import createAuthAadResponseHandler from "./response-handlers/auth.aad.sf";
import createAuthWindowsResponseHandler from "./response-handlers/auth.windows";

const trustedCerts: IDictionary<boolean | Promise<boolean>> = Object.create(null);

function CheckServerCert(serverName: string, cert: ICertificateInfo): boolean {
    const record = trustedCerts[cert.thumbprint];

    if (typeof record === "boolean") {
        return record;
    }

    const response = dialog.showMessageBox({
        type: "warning",
        buttons: ["Yes", "Exit"],
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

    return trustedCerts[cert.thumbprint] = response === 0;
}

const clientCertMap: IDictionary<ICertificate | ICertificateInfo | Promise<ICertificate | ICertificateInfo>> = Object.create(null);

function SelectClientCertAsync(urlString: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo> {
    const siteId = url.parse(urlString).host;
    const record = clientCertMap[siteId];

    if (record instanceof Promise) {
        return record;
    } else if (record) {
        return Promise.resolve(record);
    }

    return clientCertMap[siteId] = new Promise<ICertificate | ICertificateInfo>((resolve, reject) => {
        const promptPromise = sfxModuleManager.getComponentAsync("prompt.select-certificate", certInfos);

        promptPromise
            .then((prompt) => prompt.openAsync())
            .then((selectedCert) => resolve(clientCertMap[siteId] = selectedCert), (err) => reject(err))
            .then(() => promptPromise)
            .then((prompt) => prompt.disposeAsync());
    });
}

export default class ServiceFabricHttpClient extends HttpClient {
    constructor(pkiSvc: IPkiCertificateService) {
        super([], []);

        this.requestHandlers.push(createNodeRequestHandler(CheckServerCert));

        this.responseHandlers.push(
            //createAuthAadResponseHandler(),
            createAuthCertResponseHandler(pkiSvc, SelectClientCertAsync),
            createAuthWindowsResponseHandler(),
            createRedirectionResponseHandler(),
            createJsonResponseHandler(),
            createJsonFileResponseHandler());
    }
}
