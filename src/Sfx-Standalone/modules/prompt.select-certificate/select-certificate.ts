//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICertificateInfo, ICertificate } from "sfx.cert";

import { electron } from "../../utilities/electron-adapter";

// JQuery & angular already referenced in select-certificate.html.
declare const angular: angular.IAngularStatic;

(async () => {
    const promptContext = await sfxModuleManager.getComponentAsync("prompt.prompt-context");

    interface ISelectCertScope extends angular.IScope {
        certInfos: Array<ICertificateInfo>;
        selectedCertInfo: ICertificateInfo | ICertificate;
        password: string;
        certFilePath: string;
        keyFilePath: string;

        keyFileRequired: () => boolean;
        certSelected: () => boolean;
        passwordRequired: () => boolean;

        isPfx: () => boolean;
        updateSelectedCert: (certInfo: ICertificateInfo) => void;
        selectCert: () => void;
        browseCertFiles: () => void;
        browseKeyFiles: () => void;

        getDateString: (dateNum: number) => string;
        isCertValid: (startDateInSecs: number, expiryDateInSecs: number) => boolean;

        cancel: () => void;
        freezeUI: () => void;
    }

    const selectCertificateModule = angular.module("select-certificate", []);

    class SelectCertController {
        constructor($scope: ISelectCertScope) {
            $scope.certInfos = promptContext.promptOptions.data || [];
            $scope.certInfos = $scope.certInfos.filter((certInfo) => certInfo.hasPrivateKey);

            $scope.isPfx = () => $scope.certFilePath && /\.pfx$/i.test($scope.certFilePath);
            $scope.keyFileRequired = () => $scope.certFilePath && !$scope.isPfx();

            $scope.certSelected = () =>
                ($scope.selectedCertInfo !== null
                    && $scope.selectedCertInfo !== undefined)
                    
                || ($scope.selectedCertInfo === null
                    && typeof $scope.certFilePath === "string"
                    && $scope.certFilePath.trim() !== "");

            $scope.passwordRequired = () => $scope.keyFileRequired() || $scope.isPfx();

            $scope.updateSelectedCert = (certInfo: ICertificateInfo) => {
                $scope.selectedCertInfo = certInfo;
            };

            $scope.selectCert = async () => {
                if (!$scope.selectedCertInfo) {
                    const certLoader = await sfxModuleManager.getComponentAsync("cert.cert-loader");

                    if ($scope.keyFileRequired()) {
                        $scope.selectedCertInfo = await certLoader.loadPemAsync($scope.certFilePath, $scope.keyFilePath, $scope.password);
                    } else {
                        $scope.selectedCertInfo = await certLoader.loadPfxAsync($scope.certFilePath, $scope.password);
                    }
                }

                promptContext.finish($scope.selectedCertInfo);
            };

            $scope.browseCertFiles = () => {
                const selectedFiles = electron.dialog.showOpenDialog({
                    title: "Open a client certificate ...",
                    filters: [
                        {
                            name: "certificates",
                            extensions: ["pfx", "PFX", "pem", "PEM", "crt", "CRT", "cer", "CER"]
                        },
                        {
                            name: "PFX",
                            extensions: ["pfx", "PFX"]
                        },
                        {
                            name: "PEM",
                            extensions: ["pem", "PEM"]
                        },
                        {
                            name: "CRT",
                            extensions: ["crt", "CRT"]
                        },
                        {
                            name: "CER",
                            extensions: ["cer", "CER"]
                        }
                    ],
                    message: "Please select a certificate to use.",
                    properties: ["openFile", "createDirectory"]
                });

                if (!selectedFiles || selectedFiles.length <= 0) {
                    return;
                }

                $scope.certFilePath = selectedFiles[0];
            };

            $scope.browseKeyFiles = () => {
                const selectedFiles = electron.dialog.showOpenDialog({
                    title: "Open a key file for the client certificate ...",
                    filters: [
                        {
                            name: "key file",
                            extensions: ["key"]
                        }
                    ],
                    message: "Please select the key for the supplied client certificate.",
                    properties: ["openFile", "createDirectory"]
                });

                if (!selectedFiles || selectedFiles.length <= 0) {
                    return;
                }

                $scope.keyFilePath = selectedFiles[0];
            };

            $scope.getDateString = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

            $scope.isCertValid = (startDate, expiryDate) => {
                const now = Date.now();

                return now >= startDate && now < expiryDate;
            };

            $scope.cancel = () => promptContext.finish(null);
        }
    }

    selectCertificateModule.controller("selectCertController", ["$scope", SelectCertController]);
})();