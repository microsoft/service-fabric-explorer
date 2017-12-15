import { BrowserWindow, Certificate, dialog, app } from "electron";
import * as url from "url";
import * as path from "path";
import * as fs from "fs";
import * as tmp from "tmp";
import { Buffer } from "buffer";
import * as util from "util";

import env, { Platform } from "../env";
import prompt from "../../prompts/input/prompt";
import resolve, { local } from "../resolve";

function showCertSelectPrompt(
    window: BrowserWindow,
    certificateList: Array<Certificate>,
    callback: (selectedCert: Certificate, certsToImport: Array<string>) => void): void {

    let certSelectionButtons = new Array<string>();
    let importCertsResponse = -1;

    if (util.isArray(certificateList)) {
        certificateList.forEach(certificate => certSelectionButtons.push(certificate.subjectName + "\r\nIssuer: " + certificate.issuerName + "\r\nThumbprint: " + certificate.fingerprint));
    }

    if (env.platform === Platform.Linux) {
        importCertsResponse = certSelectionButtons.push("Import more certificates ...") - 1;
    }

    dialog.showMessageBox(
        window,
        {
            type: "question",
            buttons: certSelectionButtons,
            title: "Which client certificate to use ?",
            message: "Please select a client certificate below to connect to the server.",
            cancelId: -1
        },
        (response, checkboxChecked) => {
            if (response === -1) {
                callback(null, null);
                return;
            }

            if (response !== importCertsResponse) {
                callback(certificateList[response], null);
                return;
            }

            dialog.showOpenDialog(
                window,
                {
                    title: "Import certificiates ...",
                    filters: [
                        {
                            name: "Certificates (*.pfx; *.p12)",
                            extensions: ["p12", "pfx"]
                        }
                    ],
                    properties: ["openFile", "multiSelections"]
                },
                (filePaths) => {
                    if (util.isArray(filePaths) && filePaths.length > 0) {
                        callback(null, filePaths);
                    } else {
                        callback(null, null);
                    }
                });
        });
}

function importCertificates(certPaths: Array<string>, callback: (allSucceeded: boolean) => void): void {
    let allSucceeded = true;
    let doneNumber = 0;

    certPaths.forEach((certPath) => {
        prompt(
            {
                password: true,
                title: "Importing certificate: " + path.basename(certPath),
                message: "Please provide the password to decrypt the certificate:"
            },
            (error, input) => {
                if (util.isNullOrUndefined(input) || input === "") {
                    input = null;
                }

                app.importCertificate(
                    {
                        certificate: certPath,
                        password: input,
                    },
                    (result) => {
                        allSucceeded = allSucceeded && result === 0;

                        if (++doneNumber === certPaths.length) {
                            callback(allSucceeded);
                        }
                    });
            });
    });
}

interface ICertHandlingRecord {
    handling: boolean;
    callbacks: Array<(cert: Certificate) => void>;
}

function handleGenerally(window: BrowserWindow): void {
    let clientCertManager: IDictionary<ICertHandlingRecord> = {};

    window.webContents.on("select-client-certificate",
        (event, urlString, certificateList, selectCertificate) => {
            event.preventDefault();

            let certIdentifier: string = url.parse(urlString).hostname;

            if (certIdentifier in clientCertManager && clientCertManager[certIdentifier].handling) {
                clientCertManager[certIdentifier].callbacks.push(selectCertificate);
            } else {
                let certHandlingRecord = clientCertManager[certIdentifier];

                if (util.isNullOrUndefined(certHandlingRecord)) {
                    certHandlingRecord = {
                        handling: true,
                        callbacks: []
                    };

                    clientCertManager[certIdentifier] = certHandlingRecord;
                } else {
                    certHandlingRecord.handling = true;
                }

                certHandlingRecord.callbacks.push(selectCertificate);

                showCertSelectPrompt(
                    window,
                    certificateList,
                    (selectedCert, certPaths) => {
                        if (util.isNullOrUndefined(selectedCert)) {
                            if (util.isNullOrUndefined(certPaths)) {
                                window.close();
                            } else {
                                importCertificates(certPaths, () => {
                                    certHandlingRecord.handling = false;
                                    window.reload();
                                });
                            }
                        } else {
                            certHandlingRecord.callbacks.forEach((selectCertificateFunc) => selectCertificateFunc(selectedCert));

                            delete clientCertManager[certIdentifier];
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
    app.importCertificate(
        {
            certificate: dummayCertFile.name,
            password: "123456"
        },
        (result) => dummayCertFile.removeCallback());
}

export function handle(window: BrowserWindow): void {
    if (env.platform === Platform.Linux) {
        handleLinux();
    }

    handleGenerally(window);
}
