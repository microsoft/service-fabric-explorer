//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { Certificate, remote } from "electron";
import * as path from "path";

import { ISelectCertificatePromptResults } from "../../@types/prompt";
import { env, Platform } from "../../utilities/env";
import * as utils from "../../utilities/utils";

// JQuery & angular already referenced in select-certificate.html.
declare let $: JQuery;
declare let angular: angular.IAngularStatic;

const promptContext = moduleManager.getComponent("prompt-context");

interface ISelectCertScope extends angular.IScope {
    certificates: Array<Certificate>;

    getDateString: (dateNum: number) => string;
    isCertValid: (startDateInSecs: number, expiryDateInSecs: number) => boolean;

    supportImportCerts: () => boolean;

    cancel: () => void;
    selectCert: (cert: Certificate) => void;
    importCerts: () => void;
}

function importCertificates(certPaths: Array<string>, callback: (allSucceeded: boolean) => void): void {
    let allSucceeded = true;
    let doneNumber = 0;

    certPaths.forEach((certPath) => {
        moduleManager.getComponent(
            "prompt-input",
            remote.getCurrentWindow().id,
            {
                password: true,
                title: "Importing certificate: " + path.basename(certPath),
                message: "Please provide the password to decrypt the certificate:"
            },
            (error, input) => {
                if (utils.isNullOrUndefined(input) || input === "") {
                    input = null;
                }

                remote.app.importCertificate(
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


let selectCertificateModule = angular.module("select-certificate", []);

class SelectCertController {
    constructor($scope: ISelectCertScope) {
        $scope.certificates = promptContext.promptOptions.data;

        $scope.getDateString = (dateInSecs) => new Date(dateInSecs * 1000).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        $scope.isCertValid = (startDateInSecs, expiryDateInSecs) => {
            let now = Date.now();

            return now >= startDateInSecs * 1000 && now < expiryDateInSecs * 1000;
        };

        $scope.supportImportCerts = () => env.platform === Platform.Linux;

        $scope.cancel = () => promptContext.close();

        $scope.selectCert = (cert) => promptContext.finish(<ISelectCertificatePromptResults>{
            selectedCertificate: cert,
            certificatesImported: false
        });

        $scope.importCerts = () => {
            remote.dialog.showOpenDialog(
                remote.getCurrentWindow(),
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
                    if (Array.isArray(filePaths) && filePaths.length > 0) {
                        importCertificates(filePaths, (allSucceeded) => promptContext.finish(<ISelectCertificatePromptResults>{ certificatesImported: true }));
                    }
                });
        };
    }
}

selectCertificateModule.controller("selectCertController", ["$scope", SelectCertController]);
