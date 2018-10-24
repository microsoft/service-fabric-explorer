//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IReplicaViewScope extends angular.IScope {
        replica: ReplicaOnPartition;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        replicaEvents: ReplicaEventList;
    }

    export class ReplicaViewController extends MainViewController {
        public appId: string;
        public serviceId: string;
        public partitionId: string;
        public replicaId: string;
        public appTypeName: string;

        constructor($injector: angular.auto.IInjectorService, private $scope: IReplicaViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "events": { name: "Events" }
            });
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            let params = this.routeParams;
            this.appId = IdUtils.getAppId(params);
            this.serviceId = IdUtils.getServiceId(params);
            this.partitionId = IdUtils.getPartitionId(params);
            this.replicaId = IdUtils.getReplicaId(params);
            this.appTypeName = IdUtils.getAppTypeName(params);

            if (this.appTypeName === Constants.SystemAppTypeName) {
                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.systemAppGroup(),
                    IdGenerator.service(this.serviceId),
                    IdGenerator.partition(this.partitionId),
                    IdGenerator.replica(this.replicaId)
                ]);
            } else {
                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.appGroup(),
                    IdGenerator.appType(this.appTypeName),
                    IdGenerator.app(this.appId),
                    IdGenerator.service(this.serviceId),
                    IdGenerator.partition(this.partitionId),
                    IdGenerator.replica(this.replicaId)
                ]);
            }

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.replicaEvents = this.data.createReplicaEventList(this.partitionId, this.replicaId);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getReplicaOnPartition(this.appId, this.serviceId, this.partitionId, this.replicaId, true, messageHandler)
                .then(replica => {
                    this.$scope.replica = replica;
                    return this.$scope.replica.health.refresh(messageHandler);
                });
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.replica.detail.refresh(messageHandler);
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.replicaEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }
    }

    (function () {

        let module = angular.module("replicaViewController", ["ngRoute", "dataService"]);
        module.controller("ReplicaViewController", ["$injector", "$scope", ReplicaViewController]);

    })();
}
