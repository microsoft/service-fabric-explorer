//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { IPkiCertificateService, ICertificateInfo, ICertificate } from "sfx.cert";

import { dialog } from "electron";

import HttpClient from "./http-client";

import createNodeRequestHandler from "./request-handlers/node";

import createRedirectionResponseHandler from "./response-handlers/redirection";
import createJsonResponseHandler from "./response-handlers/json";
import createJsonFileResponseHandler from "./response-handlers/json-file";
import createAuthCertResponseHandler from "./response-handlers/auth.cert";
import createAuthAadResponseHandler from "./response-handlers/auth.aad.sf";
import createAuthWindowsResponseHandler from "./response-handlers/auth.windows";

const trustedCerts: IDictionary<boolean> = Object.create(null);

function CheckServerCertAsync(serverName: string, cert: ICertificateInfo): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (trustedCerts[cert.thumbprint] === true) {
            resolve(true);
        } else if (trustedCerts[cert.thumbprint] === false) {
            resolve(false);
        }

        dialog.showMessageBox(
            {
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
            },
            (response, checkboxChecked) => {
                if (response !== 0) {
                    trustedCerts[cert.thumbprint] = false;
                    resolve(false);

                } else {
                    trustedCerts[cert.thumbprint] = true;
                    resolve(true);
                }
            });
    });
}

async function SelectClientCertAsync(url: string, certInfos: Array<ICertificateInfo>): Promise<ICertificate | ICertificateInfo> {
    const prompt = await sfxModuleManager.getComponentAsync("prompt.select-certificate", certInfos);
    
    try {
        return await prompt.openAsync();
    } finally {
        if (prompt) {
            await prompt.disposeAsync();
        }
    }
}

export default class ServiceFabricHttpClient extends HttpClient {
    constructor(pkiSvc: IPkiCertificateService) {
        super([], []);

        this.requestHandlers.push(createNodeRequestHandler(CheckServerCertAsync));

        this.responseHandlers.push(
            createAuthAadResponseHandler(),
            createAuthCertResponseHandler(pkiSvc, SelectClientCertAsync),
            createAuthWindowsResponseHandler(),
            createRedirectionResponseHandler(),
            createJsonResponseHandler(),
            createJsonFileResponseHandler());
    }
}
