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
        nodeView: string;
    }

    export class ReplicaViewController extends MainViewController {
        public appId: string;
        public serviceId: string;
        public partitionId: string;
        public replicaId: string;
        public appTypeName: string;
        public isSystem: boolean;

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
            this.isSystem = this.appTypeName === Constants.SystemAppTypeName;
            if (this.isSystem) {
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

                    if(!this.isSystem){
                        try {
                            //service name is the difficult one
                            //get service name with application name infront
                            this.$scope.replica.detail.ensureInitialized().then( () => {
                                const serviceAndApplicationName = this.$scope.replica.parent.parent.name;
                                const applicatioName = this.$scope.replica.parent.parent.parent.name;

                                const serviceNameOnly = this.$scope.replica.detail.raw['DeployedServiceReplicaInstance'].ServiceManifestName;
                                const activationId = this.$scope.replica.detail.raw['DeployedServiceReplicaInstance']["ServicePackageActivationId"] || null;
                                this.$scope.nodeView = this.data.routes.getDeployedReplicaViewPath(this.$scope.replica.raw.NodeName, this.appId, serviceNameOnly, activationId, this.partitionId, this.replicaId);    
                            })
                        } catch(e) {
                            console.log(e);
                        }

                    }

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
