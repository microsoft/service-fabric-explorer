//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ISelectCertificatePromptResults } from "sfx.prompt.select-certificate";

import { Certificate, remote } from "electron";
import * as path from "path";

import { env, Platform } from "../../utilities/env";
import * as utils from "../../utilities/utils";

// JQuery & angular already referenced in select-certificate.html.
declare const angular: angular.IAngularStatic;

(async () => {
    const promptContext = await sfxModuleManager.getComponentAsync("prompt.prompt-context");

    interface ISelectCertScope extends angular.IScope {
        certificates: Array<Certificate>;

        getDateString: (dateNum: number) => string;
        isCertValid: (startDateInSecs: number, expiryDateInSecs: number) => boolean;

        supportImportCerts: () => boolean;

        cancel: () => void;
        selectCert: (cert: Certificate) => void;
        importCerts: () => void;
    }

    const importCertificates = async (certPaths: Array<string>, callback: (allSucceeded: boolean) => void): Promise<void> => {
        let allSucceeded = true;
        let doneNumber = 0;

        for (const certPath of certPaths) {
            let input: string = await sfxModuleManager.getComponentAsync<string>(
                "prompt.input",
                remote.getCurrentWindow().id,
                {
                    password: true,
                    title: "Importing certificate: " + path.basename(certPath),
                    message: "Please provide the password to decrypt the certificate:"
                });

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
        }
    };

    const selectCertificateModule = angular.module("select-certificate", []);

    class SelectCertController {
        constructor($scope: ISelectCertScope) {
            $scope.certificates = promptContext.promptOptions.data;

            $scope.getDateString = (dateInSecs) => new Date(dateInSecs * 1000).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

            $scope.isCertValid = (startDateInSecs, expiryDateInSecs) => {
                const now = Date.now();

                return now >= startDateInSecs * 1000 && now < expiryDateInSecs * 1000;
            };

            $scope.supportImportCerts = () => env.platform === Platform.Linux;

            $scope.cancel = () => promptContext.finish(null);

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
})();
