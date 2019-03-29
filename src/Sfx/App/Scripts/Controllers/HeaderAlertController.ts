//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class HeaderAlertController {
        static $inject = ["$scope", "dataService"];

        clusterUpgradeProgress: ClusterUpgradeProgress;

        constructor(private data: DataService, private $scope: any) {
            this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
            console.log(this['clusterUpgradeProgress'])
        }

        public getUpgradeDomainProgress(): string {
            return `(${this.clusterUpgradeProgress.getCompletedUpgradeDomains()} / ${this.clusterUpgradeProgress.upgradeDomains.length} UDs completed)`;
        }

    }

    (function () {

        let module = angular.module("headerAlertController", []);
        module.controller("HeaderAlertController", ["data", "$scope", HeaderAlertController]);

    })();
}
