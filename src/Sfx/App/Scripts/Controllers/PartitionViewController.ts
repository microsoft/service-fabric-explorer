//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IPartitionViewScope extends angular.IScope {
        partition: Partition;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        partitionBackupListSettings: ListSettings;
        partitionEvents: PartitionEventList;
        partitionTimeLineGenerator: PartitionTimelineGenerator;
    }


    export class PartitionViewController extends MainViewController {
        public appId: string;
        public serviceId: string;
        public partitionId: string;
        public appTypeName: string;

        constructor($injector: angular.auto.IInjectorService, private $scope: IPartitionViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "events": { name: "Events" },
                "backups": { name: "Backups" }
            });

            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);
            this.tabs["backups"].refresh = (messageHandler) => this.refreshBackups(messageHandler);

            this.appId = IdUtils.getAppId(this.routeParams);
            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.partitionId = IdUtils.getPartitionId(this.routeParams);
            this.appTypeName = IdUtils.getAppTypeName(this.routeParams);

            if (this.appTypeName === Constants.SystemAppTypeName) {
                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.systemAppGroup(),
                    IdGenerator.service(this.serviceId),
                    IdGenerator.partition(this.partitionId)
                ]);
            } else {
                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.appGroup(),
                    IdGenerator.appType(this.appTypeName),
                    IdGenerator.app(this.appId),
                    IdGenerator.service(this.serviceId),
                    IdGenerator.partition(this.partitionId)
                ]);
            }

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.partitionEvents = this.data.createPartitionEventList(this.partitionId);
            this.$scope.partitionTimeLineGenerator = new PartitionTimelineGenerator();
            this.$scope.partitionBackupListSettings = this.settings.getNewOrExistingListSettings("partitionBackups", [null], [
                new ListColumnSetting("raw.BackupId", "BackupId", ["raw.BackupId"], false, (item, property) => `<span class="link"'>${property}</span>` , 1, item => item.action.runWithCallbacks.apply(item.action)),
                new ListColumnSetting("raw.BackupType", "BackupType"),
                new ListColumnSetting("raw.EpochOfLastBackupRecord.DataLossVersion", "Data Loss Version"),
                new ListColumnSetting("raw.EpochOfLastBackupRecord.ConfigurationVersion", "Configuration Version"),
                new ListColumnSetting("raw.LsnOfLastBackupRecord", "Lsn of last Backup Record"),
                new ListColumnSetting("raw.CreationTimeUtc", "Creation Time Utc"),
            ]);

            this.data.clusterManifest.ensureInitialized().then( () => {
                if(!this.data.clusterManifest.isBRSEnabled) {
                    delete this.tabs["backups"];
                }
            })
            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getPartition(this.appId, this.serviceId, this.partitionId, true, messageHandler)
                .then(partition => {
                    this.$scope.partition = partition;

                    this.data.clusterManifest.ensureInitialized().then( () => {
                        if(this.data.clusterManifest.isBRSEnabled) {
                            this.data.backupPolicies.refresh(messageHandler);
                            if (this.$scope.partition.isStatefulService) {
                                this.$scope.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh(messageHandler);
                            }
                        }
                    })

                    if (this.$scope.partition.isStatelessService || partition.parent.parent.raw.TypeName === "System") {
                        this.tabs = {
                            "essentials": { name: "Essentials" },
                            "details": { name: "Details" },
                            "events": { name: "Events" },
                        };
                        this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
                        this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
                        this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);
                    }
                    if (!this.$scope.listSettings) {
                        let defaultSortProperties = ["replicaRoleSortPriority", "raw.NodeName"];
                        let columnSettings = [
                            new ListColumnSettingForLink("id", "Id", item => item.viewPath),
                            new ListColumnSetting("raw.NodeName", "Node Name"),
                            new ListColumnSettingWithFilter("role", "Replica Role", defaultSortProperties),
                            new ListColumnSettingForBadge("healthState", "Health State"),
                            new ListColumnSettingWithFilter("raw.ReplicaStatus", "Status")
                        ];

                        if (partition.isStatelessService) {
                            columnSettings.splice(2, 1); // Remove replica role column
                            defaultSortProperties = ["raw.NodeName"];
                        }

                        // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
                        this.$scope.listSettings = this.settings.getNewOrExistingListSettings("replicas", defaultSortProperties, columnSettings);
                    }
                    return this.$scope.partition.health.refresh(messageHandler);
                });
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {

            this.data.clusterManifest.ensureInitialized().then( () => {
                if(this.data.clusterManifest.isBRSEnabled) {
                    this.$scope.partition.partitionBackupInfo.partitionBackupProgress.refresh(messageHandler);
                    this.$scope.partition.partitionBackupInfo.partitionRestoreProgress.refresh(messageHandler);
                }
            })

            return this.$scope.partition.loadInformation.refresh(messageHandler);
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            this.data.clusterManifest.ensureInitialized().then( () => {
                if(this.data.clusterManifest.isBRSEnabled && this.$scope.partition.isStatefulService) {
                    this.$scope.partition.partitionBackupInfo.latestPartitionBackup.refresh(messageHandler);
                }
            })

            return this.$scope.partition.replicas.refresh(messageHandler);
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.partitionEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }

        private refreshBackups(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (this.$scope.partition.isStatefulService) {
                return this.$scope.partition.partitionBackupInfo.partitionBackupList.refresh(messageHandler);
            }
        }
    }

    (function () {

        let module = angular.module("partitionViewController", ["ngRoute", "dataService"]);
        module.controller("PartitionViewController", ["$injector", "$scope", PartitionViewController]);

    })();
}
