//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedAppViewScope extends angular.IScope {
        deployedApp: DeployedApplication;
        deployedServicePackages: DeployedServicePackageCollection;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }

    export class DeployedAppViewController extends MainViewController {
        public appId: string;
        public nodeName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedAppViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);

            this.appId = IdUtils.getAppId(this.routeParams);
            this.nodeName = IdUtils.getNodeName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(this.appId)
            ]);

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("servicePackages", ["name"], [
                new ListColumnSettingForLink("uniqueId", "Name", item => item.viewPath),
                new ListColumnSetting("raw.Version", "Version"),
                new ListColumnSettingForBadge("health.healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.Status", "Status")
            ]);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getDeployedApplication(this.nodeName, this.appId, true).then(deployedApp => {
                this.$scope.deployedApp = deployedApp;
                return this.$scope.deployedApp.health.refresh(messageHandler);
            });
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.deployedApp.deployedServicePackages.refresh(messageHandler).then(servicePackages => {
                this.$scope.deployedServicePackages = servicePackages;
            });
        }
    }

    (function () {

        let module = angular.module("deployedAppViewController", ["ngRoute", "dataService"]);
        module.controller("DeployedAppViewController", ["$injector", "$scope", DeployedAppViewController]);

    })();
}
