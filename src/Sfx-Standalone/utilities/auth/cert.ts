//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { app, BrowserWindow, Certificate } from "electron";
import * as url from "url";
import * as fs from "fs";
import * as tmp from "tmp";
import { Buffer } from "buffer";

import { electron } from "../electron-adapter";
import { env, Platform } from "../env";
import { local } from "../appUtils";
import * as utils from "../utils";
import { IModuleManager } from "sfx.module-manager";
import { IDictionary } from "sfx.common";

function showCertSelectPrompt(
    moduleManager: IModuleManager,
    window: BrowserWindow,
    certificateList: Array<Certificate>,
    callback: (selectedCert: Certificate, certsImported: boolean) => void): void {

    let certSelectionButtons = new Array<string>();
    let importCertsResponse = -1;

    if (Array.isArray(certificateList)) {
        certificateList.forEach(certificate => certSelectionButtons.push(certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint));
    }

    if (env.platform === Platform.Linux) {
        importCertsResponse = certSelectionButtons.push("Import more certificates ...") - 1;
    }

    moduleManager.getComponentAsync("prompt-select-certificate",
        window.id,
        certificateList,
        (error, results) => {
            if (utils.isNullOrUndefined(results)) {
                callback(null, false);
            } else if (results.selectedCertificate) {
                callback(results.selectedCertificate, false);
            } else {
                callback(null, results.certificatesImported);
            }
        });
}

interface ICertHandlingRecord {
    handling: boolean;
    callbacks: Array<(cert: Certificate) => void>;
}

function handleGenerally(moduleManager: IModuleManager, window: BrowserWindow): void {
    let clientCertManager: IDictionary<ICertHandlingRecord> = {};
    
    app.on("select-client-certificate",
        (event, webContents, urlString, certificateList, selectCertificateCallback) => {
            event.preventDefault();
            
            let certIdentifier: string = url.parse(urlString).hostname;

            if (certIdentifier in clientCertManager && clientCertManager[certIdentifier].handling) {
                clientCertManager[certIdentifier].callbacks.push(selectCertificateCallback);
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

                certHandlingRecord.callbacks.push(selectCertificateCallback);

                showCertSelectPrompt(
                    moduleManager,
                    window,
                    certificateList,
                    (selectedCert, certsImported) => {
                        if (selectedCert) {
                            certHandlingRecord.callbacks.forEach((selectCertificateFunc) => selectCertificateFunc(selectedCert));

                            delete clientCertManager[certIdentifier];
                        } else if (certsImported) {
                            certHandlingRecord.handling = false;
                            window.reload();
                        } else {
                            //electron.app.exit();
                        }
                    });
            }
        });
}

function handleLinux(): void {
    // Because it is possible that there is no cert in the chromium cert store.
    // Add a dummy cert to the store first, which can ensure that event "select-client-certificate" fires correctly.

    let dummyCertData = new Buffer(require(local("./dummycert.json")).data, "base64");
    let dummayCertFile = tmp.fileSync();

    fs.writeFileSync(dummayCertFile.fd, dummyCertData);
    electron.app.importCertificate(
        {
            certificate: dummayCertFile.name,
            password: "123456"
        },
        (result) => dummayCertFile.removeCallback());
}

export function handle(moduleManager: IModuleManager, window: BrowserWindow): void {
    if (env.platform === Platform.Linux) {
        handleLinux();
    }

    handleGenerally(moduleManager, window);
}
