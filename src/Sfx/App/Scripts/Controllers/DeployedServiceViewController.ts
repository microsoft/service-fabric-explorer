//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedServiceViewScope extends angular.IScope {
        servicePackage: DeployedServicePackage;
        serviceManifest: string;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }

    export class DeployedServiceViewController extends MainViewController {
        public serviceId: string;
        public activationId: string;
        public appId: string;
        public nodeName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedServiceViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "manifest": { name: "Manifest" }
            });
            this.tabs["manifest"].refresh = (messageHandler) => this.refreshManifest(messageHandler);

            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.activationId = IdUtils.getServicePackageActivationId(this.routeParams);
            this.nodeName = IdUtils.getNodeName(this.routeParams);
            this.appId = IdUtils.getAppId(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(this.appId),
                IdGenerator.deployedServicePackage(this.serviceId, this.activationId)
            ]);

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all([
                this.data.getDeployedServicePackage(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
                    .then(servicePackage => {
                        this.$scope.servicePackage = servicePackage;

                        return this.$scope.servicePackage.health.refresh(messageHandler);
                    })
            ]);
        }

        private refreshManifest(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.servicePackage.manifest.refresh(messageHandler).then(manifest => {
                this.$scope.serviceManifest = manifest.raw.Manifest;
            });
        }
    }

    (function () {

        let module = angular.module("deployedServiceViewController", ["ngRoute", "dataService"]);
        module.controller("DeployedServiceViewController", ["$injector", "$scope", DeployedServiceViewController]);

    })();
}
