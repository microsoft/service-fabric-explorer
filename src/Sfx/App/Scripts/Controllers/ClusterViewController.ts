//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IClusterViewScope extends angular.IScope {
        clusterAddress: string;
        nodesDashboard: IDashboardViewModel;
        appsDashboard: IDashboardViewModel;
        servicesDashboard: IDashboardViewModel;
        partitionsDashboard: IDashboardViewModel;
        replicasDashboard: IDashboardViewModel;
        upgradesDashboard: IDashboardViewModel;
        nodes: NodeCollection;
        systemApp: SystemApplication;
        clusterHealth: ClusterHealth;
        clusterManifest: ClusterManifest;
        imageStore: ImageStore;
        clusterUpgradeProgress: ClusterUpgradeProgress;
        clusterLoadInformation: ClusterLoadInformation;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
        metricsViewModel: IMetricsViewModel;
        upgradeAppsCount: number;
        appsUpgradeTabViewPath: string;
        clusterEvents: ClusterEventList;
    }

    export class ClusterViewController extends MainViewController {

        constructor($injector: angular.auto.IInjectorService, public $scope: IClusterViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "clustermap": { name: "Cluster Map" },
                "metrics": { name: "Metrics" },
                "manifest": { name: "Manifest" },
                "imagestore": { name: "Image Store" },
                "events": { name: "Events" }
            });

            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
            this.tabs["clustermap"].refresh = (messageHandler) => this.refreshClusterMap(messageHandler);
            this.tabs["metrics"].refresh = (messageHandler) => this.refreshMetrics(messageHandler);
            this.tabs["manifest"].refresh = (messageHandler) => this.refreshManifest(messageHandler);
            this.tabs["imagestore"].refresh = (messageHandler) => this.refreshImageStore(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            $scope.clusterAddress = this.$location.protocol() + "://" + this.$location.host();

            this.selectTreeNode([
                IdGenerator.cluster()
            ]);

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings("clusterUpgradeProgressUnhealthyEvaluations");

            this.$scope.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
            this.$scope.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
            this.$scope.clusterLoadInformation = this.data.clusterLoadInformation;
            this.$scope.clusterManifest = this.data.clusterManifest;
            this.$scope.systemApp = this.data.systemApp;
            this.$scope.nodes = this.data.nodes;
            this.$scope.appsUpgradeTabViewPath = this.routes.getTabViewPath(this.routes.getAppsViewPath(), "upgrades");
            this.$scope.imageStore = this.data.imageStore;
            this.$scope.clusterEvents = this.data.createClusterEventList();

            this.refresh();
        }

        public getNodesForDomains(upgradeDomain: string, faultDomain: string): Node[] {
            return _.filter(this.$scope.nodes.collection, (node) => node.upgradeDomain === upgradeDomain && node.faultDomain === faultDomain);
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let promises: angular.IPromise<any>[] = [];

            // For unhealthy evaluations and dashboards
            promises.push(this.$scope.clusterHealth.refresh(messageHandler)
                .then((clusterHealth: ClusterHealth) => {
                    let nodesHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Node);
                    this.$scope.nodesDashboard = DashboardViewModel.fromHealthStateCount("Nodes", "Node", true, nodesHealthStateCount, this.data.routes, this.routes.getNodesViewPath());

                    let appsHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Application);
                    this.$scope.appsDashboard = DashboardViewModel.fromHealthStateCount("Applications", "Application", true, appsHealthStateCount, this.data.routes, this.routes.getAppsViewPath());

                    let servicesHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Service);
                    this.$scope.servicesDashboard = DashboardViewModel.fromHealthStateCount("Services", "Service", false, servicesHealthStateCount);

                    let partitionsDashboard = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Partition);
                    this.$scope.partitionsDashboard = DashboardViewModel.fromHealthStateCount("Partitions", "Partition", false, partitionsDashboard);

                    let replicasHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Replica);
                    this.$scope.replicasDashboard = DashboardViewModel.fromHealthStateCount("Replicas", "Replica", false, replicasHealthStateCount);
                }));

            // For upgrade dashboard
            promises.push(this.data.getApps(true, messageHandler)
                .then(apps => {
                    this.$scope.upgradeAppsCount = _.filter(apps.collection, app => app.isUpgrading).length;
                }));

            // For healthy seed nodes / fault domains and upgrade domains
            promises.push(this.$scope.nodes.refresh(messageHandler));

            // For system application health state
            promises.push(this.$scope.systemApp.refresh(messageHandler));

            promises.push(this.$scope.clusterUpgradeProgress.refresh(messageHandler));

            return this.$q.all(promises);
        }

        private refreshClusterMap(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.nodes.refresh(messageHandler);
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all([
                this.$scope.clusterHealth.refresh(messageHandler),
                this.$scope.clusterUpgradeProgress.refresh(messageHandler),
                this.$scope.clusterLoadInformation.refresh(messageHandler)
            ]);
        }

        private refreshMetrics(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.all([
                this.$scope.nodes.refresh(messageHandler),
                this.$scope.clusterLoadInformation.refresh(messageHandler)]).then(
                    () => {
                        if (!this.$scope.metricsViewModel) {
                            this.$scope.metricsViewModel =
                                this.settings.getNewOrExistingMetricsViewModel(this.$scope.clusterLoadInformation, _.map(this.$scope.nodes.collection, node => node.loadInformation));
                        }

                        let promises = _.map(this.$scope.nodes.collection, node => node.loadInformation.refresh(messageHandler));

                        return this.$q.all(promises).finally(() => {
                            this.$scope.metricsViewModel.refresh();
                        });
                    });
        }

        private refreshManifest(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.clusterManifest.refresh(messageHandler);
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.clusterEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }

        private refreshImageStore(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            this.$scope.imageStore.getSummaryTabInfo();
            return this.$scope.imageStore.refresh(messageHandler);
        }
    }
    (function () {

        let module = angular.module("clusterViewController", ["dataService", "filters"]);
        module.controller("ClusterViewController", ["$injector", "$scope", ClusterViewController]);

    })();
}
