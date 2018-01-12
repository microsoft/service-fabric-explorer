//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export interface ISystemAppsViewScope extends angular.IScope {
        systemApp: SystemApplication;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
    }

    export class SystemAppsViewController extends MainViewController {

        constructor($injector: angular.auto.IInjectorService, private $scope: ISystemAppsViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.systemAppGroup()
            ]);

            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("systemServices", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Service Type"),
                new ListColumnSetting("raw.ManifestVersion", "Version"),
                new ListColumnSettingWithFilter("raw.ServiceKind", "Service Kind"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.ServiceStatus", "Status")
            ]);
            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getSystemApp(true, messageHandler).then(systemApp => {
                this.$scope.systemApp = systemApp;

                // Don't need to refresh the systemApp.health here because it is done in data.getSystemApp already.
            });
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.systemApp.services.refresh(messageHandler);
        }
    }

    (function () {

        let module = angular.module("systemAppsViewController", ["dataService", "filters"]);
        module.controller("SystemAppsViewController", ["$injector", "$scope", SystemAppsViewController]);

    })();
}
