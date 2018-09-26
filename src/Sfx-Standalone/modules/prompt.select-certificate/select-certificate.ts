//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICertificateInfo, ICertificate } from "sfx.cert";

// JQuery & angular already referenced in select-certificate.html.
declare const angular: angular.IAngularStatic;

(async () => {
    const promptContext = await sfxModuleManager.getComponentAsync("prompt.prompt-context");

    interface ISelectCertScope extends angular.IScope {
        certInfos: Array<ICertificateInfo>;

        getDateString: (dateNum: number) => string;
        isCertValid: (startDateInSecs: number, expiryDateInSecs: number) => boolean;

        cancel: () => void;
        selectCert: (cert: ICertificateInfo | ICertificate) => void;
    }

    const selectCertificateModule = angular.module("select-certificate", []);

    class SelectCertController {
        constructor($scope: ISelectCertScope) {
            $scope.certInfos = promptContext.promptOptions.data;

            $scope.getDateString = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

            $scope.isCertValid = (startDate, expiryDate) => {
                const now = Date.now();

                return now >= startDate && now < expiryDate;
            };

            $scope.cancel = () => promptContext.finish(null);

            $scope.selectCert = (cert) => promptContext.finish(cert);
        }
    }

    selectCertificateModule.controller("selectCertController", ["$scope", SelectCertController]);
})();
