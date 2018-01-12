//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedServiceCodePackagesViewScope extends angular.IScope {
        codePackages: DeployedCodePackageCollection;
        listSettings: ListSettings;
    }

    export class DeployedServiceCodePackagesViewController extends MainViewController {
        public nodeName: string;
        public appId: string;
        public serviceId: string;
        public activationId: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedServiceCodePackagesViewScope) {
            super($injector);

            this.nodeName = IdUtils.getNodeName(this.routeParams);
            this.appId = IdUtils.getAppId(this.routeParams);
            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.activationId = IdUtils.getServicePackageActivationId(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(IdUtils.getAppId(this.routeParams)),
                IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
                IdGenerator.deployedCodePackageGroup()
            ]);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getDeployedCodePackages(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
                .then(codePackages => {
                    this.$scope.codePackages = codePackages;

                    if (!this.$scope.listSettings && codePackages.length > 0) {
                        let columnSettings = [
                            new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                            new ListColumnSettingWithFilter("raw.HostType", "Host Type"),
                            new ListColumnSettingWithFilter("raw.HostIsolationMode", "Host Isolation Mode"),
                            new ListColumnSetting("raw.Version", "Version"),
                            new ListColumnSetting("raw.MainEntryPoint.ProcessId", "Process Id"),
                            new ListColumnSettingWithFilter("raw.Status", "Status"),
                        ];

                        if (_.some(codePackages.collection, cp => cp.servicePackageActivationId)) {
                            columnSettings.splice(3, 0, new ListColumnSetting("servicePackageActivationId", "Service Package Activation Id"));
                        }

                        this.$scope.listSettings = this.settings.getNewOrExistingListSettings("codePkgs", ["name"], columnSettings);
                    }
                });
        }
    }

    (function () {

        let module = angular.module("deployedServiceCodePackagesViewController", []);
        module.controller("DeployedServiceCodePackagesViewController", ["$injector", "$scope", DeployedServiceCodePackagesViewController]);

    })();
}
