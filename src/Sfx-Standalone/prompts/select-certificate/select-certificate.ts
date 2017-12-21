import * as $ from "jquery";
import * as angular from "angular";
import { Certificate, remote } from "electron";
import * as util from "util";
import * as path from "path";

import promptInput from "../input/prompt";
import env, { Platform } from "../../utilities/env";
import { PromptContext } from "../prompts.context";
import { ISelectCertificatePromptResults } from "./prompt";

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
        promptInput(
            remote.getCurrentWindow(),
            {
                password: true,
                title: "Importing certificate: " + path.basename(certPath),
                message: "Please provide the password to decrypt the certificate:"
            },
            (error, input) => {
                if (util.isNullOrUndefined(input) || input === "") {
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
        $scope.certificates = PromptContext.getInstance().promptOptions.data;

        $scope.getDateString = (dateInSecs) => new Date(dateInSecs * 1000).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        $scope.isCertValid = (startDateInSecs, expiryDateInSecs) => {
            let now = Date.now();

            return now >= startDateInSecs * 1000 && now < expiryDateInSecs * 1000;
        };

        $scope.supportImportCerts = () => env.platform === Platform.Linux;

        $scope.cancel = () => PromptContext.getInstance().close();

        $scope.selectCert = (cert) => PromptContext.getInstance().finish(<ISelectCertificatePromptResults>{
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
                    if (util.isArray(filePaths) && filePaths.length > 0) {
                        importCertificates(filePaths, (allSucceeded) => PromptContext.getInstance().finish(<ISelectCertificatePromptResults>{ certificatesImported: true }));
                    }
                });
        };
    }
}

selectCertificateModule.controller("selectCertController", ["$scope", SelectCertController]);
