//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedCodePackageViewScope extends angular.IScope {
        deployedCodePackage: DeployedCodePackage;
        containerLogs: string;
    }

    export class DeployedCodePackageViewController extends MainViewController {
        public nodeName: string;
        public appId: string;
        public serviceId: string;
        public activationId: string;
        public codePackageName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedCodePackageViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "containerLogs": { name: "Container Logs" }
            });
            this.tabs["containerLogs"].refresh = (messageHandler) => this.refreshContainerLogs(messageHandler);

            this.nodeName = IdUtils.getNodeName(this.routeParams);
            this.appId = IdUtils.getAppId(this.routeParams);
            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.activationId = IdUtils.getServicePackageActivationId(this.routeParams);
            this.codePackageName = IdUtils.getCodePackageName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(this.appId),
                IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
                IdGenerator.deployedCodePackageGroup(),
                IdGenerator.deployedCodePackage(this.codePackageName)
            ]);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getDeployedCodePackage(this.nodeName, this.appId, this.serviceId, this.activationId, this.codePackageName, true, messageHandler)
                .then(deployedCodePackage => {
                    this.$scope.deployedCodePackage = deployedCodePackage;
                    if (deployedCodePackage.raw.HostType !== Constants.ContainerHostTypeName) {
                        // Remove containerLogs tab for non Container HostTypes
                        delete (this.tabs["containerLogs"]);
                    }
                });
        }

        private refreshContainerLogs(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.deployedCodePackage.containerLogs.refresh(messageHandler).then(containerLogs => {
                this.$scope.containerLogs = containerLogs.raw.Content;
            });
        }
    }

    (function () {

        let module = angular.module("deployedCodePackageViewController", ["ngRoute", "dataService"]);
        module.controller("DeployedCodePackageViewController", ["$injector", "$scope", DeployedCodePackageViewController]);

    })();
}
