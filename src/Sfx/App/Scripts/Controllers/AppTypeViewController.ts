//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IAppTypeViewScope extends angular.IScope {
        appTypeGroup: ApplicationTypeGroup;
        appsListSettings: ListSettings;
        appTypesListSettings: ListSettings;
    }

    export class AppTypeViewController extends MainViewController {
        public appTypeName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IAppTypeViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);

            this.appTypeName = IdUtils.getAppTypeName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.appGroup(),
                IdGenerator.appType(this.appTypeName)
            ]);

            this.$scope.appTypesListSettings = this.settings.getNewOrExistingListSettings(
                "appTypeAppTypes",
                ["raw.Version"],
                [
                    new ListColumnSetting("name", "Name"),
                    new ListColumnSetting("raw.Version", "Version"),
                    new ListColumnSettingWithFilter("raw.Status", "Status"),
                    new ListColumnSetting("actions", "Actions", null, false, (item) => `<${Constants.DirectiveNameActionsRow} actions="item.actions" source="serviceTypesTable"></${Constants.DirectiveNameActionsRow}>`)
                ],
                [
                    new ListColumnSetting("placeholder", "placeholder", null, false), // Empty column
                    new ListColumnSetting("raw.StatusDetails", "Status Details", null, false, (item) => HtmlUtils.getSpanWithCustomClass("preserve-whitespace-wrap", item.raw.StatusDetails), 100)
                ],
                false /* collapsable */,
                (item) => item.raw.StatusDetails, /* only show second row when status details is not empty */
                false /* searchable */);

            this.$scope.appsListSettings = this.settings.getNewOrExistingListSettings("appTypeApps", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Application Type"),
                new ListColumnSetting("raw.TypeVersion", "Version"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.Status", "Status"),
            ]);
            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getAppTypeGroup(this.appTypeName, true).then(appTypeGroup => {
                this.$scope.appTypeGroup = appTypeGroup;
            });
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            // Refreshing apps will also refresh all apps in all appTypeGroups.
            return this.data.getApps(true, messageHandler);
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all(_.map(this.$scope.appTypeGroup.appTypes, appType => appType.serviceTypes.refresh(messageHandler).then(() => {
                return this.$q.all(_.map(appType.serviceTypes.collection, serviceType => serviceType.manifest.refresh(messageHandler)));
            })));
        }
    }

    (function () {

        let module = angular.module("appTypeViewController", ["ngRoute", "dataService"]);
        module.controller("AppTypeViewController", ["$injector", "$scope", AppTypeViewController]);

    })();
}
