//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IDictionary } from "sfx.common";
import { IModuleManager } from "sfx.module-manager";

import { app, Certificate } from "electron";
import * as url from "url";
import * as fs from "fs";
import * as tmp from "tmp";
import { Buffer } from "buffer";

import { electron } from "../electron-adapter";
import { env, Platform } from "../env";
import * as utils from "../utils";
import { local } from "../appUtils";

interface ICertSelectionPromptResults {
    selectedCert: Certificate;
    certsImported: boolean;
}

async function showCertSelectPromptAsync(moduleManager: IModuleManager, certificateList: Array<Certificate>): Promise<ICertSelectionPromptResults> {

    const certSelectionButtons: Array<string> = [];

    if (Array.isArray(certificateList)) {
        certificateList.forEach(certificate => certSelectionButtons.push(certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint));
    }

    if (env.platform === Platform.Linux) {
        certSelectionButtons.push("Import more certificates ...");
    }

    const prompt = await moduleManager.getComponentAsync("prompt.select-certificate", null, certificateList);
    const promptResults = await prompt.openAsync();
    const results: ICertSelectionPromptResults = {
        selectedCert: null,
        certsImported: false
    };

    if (!utils.isNullOrUndefined(promptResults)) {
        if (promptResults.selectedCertificate) {
            results.selectedCert = promptResults.selectedCertificate;
        } else {
            results.certsImported = promptResults.certificatesImported;
        }
    }

    return results;
}

interface ICertHandlingRecord {
    handling: boolean;
    callbacks: Array<(cert: Certificate) => void>;
}

function handleGenerally(moduleManager: IModuleManager): void {
    const clientCertManager: IDictionary<ICertHandlingRecord> = Object.create(null);

    app.on("select-client-certificate",
        async (event, webContents, urlString, certificateList, selectCertificate) => {
            event.preventDefault();

            const certIdentifier: string = url.parse(urlString).hostname;

            if (certIdentifier in clientCertManager && clientCertManager[certIdentifier].handling) {
                clientCertManager[certIdentifier].callbacks.push(selectCertificate);
            } else {
                let certHandlingRecord = clientCertManager[certIdentifier];

                if (utils.isNullOrUndefined(certHandlingRecord)) {
                    certHandlingRecord = {
                        handling: true,
                        callbacks: []
                    };

                    clientCertManager[certIdentifier] = certHandlingRecord;
                } else {
                    certHandlingRecord.handling = true;
                }

                certHandlingRecord.callbacks.push(selectCertificate);

                const results = await showCertSelectPromptAsync(moduleManager, certificateList);

                if (results.selectedCert) {
                    certHandlingRecord.callbacks.forEach((selectCertificateFunc) => selectCertificateFunc(results.selectedCert));
                    delete clientCertManager[certIdentifier];
                } else if (results.certsImported) {
                    certHandlingRecord.handling = false;                    
                } else {
                    // TODO: User closes dialog without selecting a certificate. Need to provide a way to re-connect the cluster.
                }
            }
        });
}

function handleLinux(): void {
    // Because it is possible that there is no cert in the chromium cert store.
    // Add a dummy cert to the store first, which can ensure that event "select-client-certificate" fires correctly.

    const dummyCertData = new Buffer(JSON.parse(fs.readFileSync(local("./dummycert.json"), { encoding: "utf8" })).data, "base64");
    const dummayCertFile = tmp.fileSync();

    fs.writeFileSync(dummayCertFile.fd, dummyCertData);
    electron.app.importCertificate(
        {
            certificate: dummayCertFile.name,
            password: "123456"
        },
        (result) => dummayCertFile.removeCallback());
}

export function handleAuth(moduleManager: IModuleManager): void {
    if (env.platform === Platform.Linux) {
        handleLinux();
    }

    handleGenerally(moduleManager);
}
