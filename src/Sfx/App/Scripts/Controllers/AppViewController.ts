//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IAppViewScope extends angular.IScope {
        app: Application;
        upgradeProgress: ApplicationUpgradeProgress;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        applicationBackupConfigurationInfoListSettings: ListSettings;
        upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
        deployedApplicationsHealthStatesListSettings: ListSettings;
        serviceTypesListSettings: ListSettings;
        deployedApplicationsHealthStates: DeployedApplicationHealthState[];
        appEvents: ApplicationEventList;
        networks: NetworkOnAppCollection;
        networkListSettings: ListSettings;
        clusterManifest: ClusterManifest;
        timelineGenerator: ApplicationTimelineGenerator;
    }

    export class AppViewController extends MainViewController {
        public appId: string;
        public appTypeName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IAppViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "deployments": { name: "Deployments", superscriptClass: "tab-superscript-badge-container" },
                "manifest": { name: "Manifest" },
                "events": { name: "Events" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["manifest"].refresh = (messageHandler) => this.refreshManifest(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            this.appId = IdUtils.getAppId(this.routeParams);
            this.appTypeName = IdUtils.getAppTypeName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.appGroup(),
                IdGenerator.appType(this.appTypeName),
                IdGenerator.app(this.appId)
            ]);

            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("services", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Service Type"),
                new ListColumnSetting("raw.ManifestVersion", "Version"),
                new ListColumnSettingWithFilter("raw.ServiceKind", "Service Kind"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.ServiceStatus", "Status")
            ]);

            this.$scope.deployedApplicationsHealthStatesListSettings = this.settings.getNewOrExistingListSettings("deployedApps", ["raw.NodeName"], [
                new ListColumnSettingForLink("raw.NodeName", "Node Name", item => item.viewPath),
                new ListColumnSettingForBadge("healthState", "Health State"),
            ]);

            this.$scope.serviceTypesListSettings = this.settings.getNewOrExistingListSettings("serviceTypes", ["raw.ServiceTypeDescription.ServiceTypeName"], [
                new ListColumnSetting("raw.ServiceTypeDescription.ServiceTypeName", "Service Type Name"),
                new ListColumnSettingWithFilter("serviceKind", "Service Kind"),
                new ListColumnSetting("raw.ServiceManifestVersion", "Service Manifest Version"),
                new ListColumnSetting("actions", "Actions", null, false, (item) => `<${Constants.DirectiveNameActionsRow} actions="item.actions" source="serviceTypesTable"></${Constants.DirectiveNameActionsRow}>`)
            ]);

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings("upgradeProgressUnhealthyEvaluations");
            this.$scope.appEvents = this.data.createApplicationEventList(this.appId);

            this.$scope.networkListSettings = this.settings.getNewOrExistingListSettings("networks", ["networkDetail.name"], [
                new ListColumnSettingForLink("networkDetail.name", "Network Name", item => item.viewPath),
                new ListColumnSetting("networkDetail.type", "Network Type"),
                new ListColumnSetting("networkDetail.addressPrefix", "Network Address Prefix"),
                new ListColumnSetting("networkDetail.status", "Network Status"),
            ]);

            this.$scope.applicationBackupConfigurationInfoListSettings = this.settings.getNewOrExistingListSettings("backupConfigurationInfoCollection", ["raw.PolicyName"], [
                new ListColumnSetting("raw.PolicyName", "Policy Name", ["raw.PolicyName"], false, (item, property) => "<a href='" + item.parent.viewPath + "/tab/details'>" + property + "</a>", 1, item => item.action.runWithCallbacks.apply(item.action)),
                new ListColumnSetting("raw.Kind", "Kind"),
                new ListColumnSetting("raw.PolicyInheritedFrom", "Policy Inherited From"),
                new ListColumnSetting("raw.ServiceName", "Service Name"),
                new ListColumnSetting("raw.PartitionId", "Partition Id"),
                new ListColumnSetting("raw.SuspensionInfo.IsSuspended", "Is Suspended"),
                new ListColumnSetting("raw.SuspensionInfo.SuspensionInheritedFrom", "Suspension Inherited From"),
            ]);
            this.$scope.clusterManifest = new ClusterManifest(this.data);
            this.$scope.networks = new NetworkOnAppCollection(this.data, this.appId);

            this.$scope.timelineGenerator = new ApplicationTimelineGenerator();
            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all([
                this.data.getApp(this.appId, true, messageHandler).then(data => {
                    this.$scope.app = data;
                    this.$scope.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler);
                    this.data.backupPolicies.refresh(messageHandler);
                    return this.$scope.app.health.refresh(messageHandler).then(() => {
                        this.$scope.deployedApplicationsHealthStates = this.$scope.app.health.deployedApplicationHealthStates;

                        if (this.$scope.app.health.deploymentsHealthState.text !== HealthStateConstants.OK) {
                            this.tabs["deployments"].superscriptInHtml = () => {
                                return `<image class="tab-superscript-badge" src="images/${this.$scope.app.health.deploymentsHealthState.badgeClass}.svg"></image>`;
                            };
                        } else {
                            this.tabs["deployments"].superscriptInHtml = null;
                        }
                    });
                }),
                this.$scope.clusterManifest.ensureInitialized(false)
            ]);
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all([
                this.$scope.app.upgradeProgress.refresh(messageHandler).then(upgradeProgress => {
                    this.$scope.upgradeProgress = upgradeProgress;
                }),
                this.$scope.app.serviceTypes.refresh(messageHandler),
                this.$scope.app.services.refresh(messageHandler),
                this.$scope.clusterManifest.isNetworkInventoryManagerEnabled ? this.$scope.networks.refresh(messageHandler) : this.$q.when(true)
            ]);
        }

        private refreshManifest(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.app.manifest.refresh(messageHandler);
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.appEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }

    }

    (function () {

        let module = angular.module("appViewController", ["ngRoute", "dataService"]);
        module.controller("AppViewController", ["$injector", "$scope", AppViewController]);

    })();
}
