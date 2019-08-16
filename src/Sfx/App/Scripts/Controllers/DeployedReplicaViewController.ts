//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedReplicaViewScope extends angular.IScope {
        replica: DeployedReplica;
        appView: string;
    }

    export class DeployedReplicaViewController extends MainViewController {
        public replicaStatus: number;

        public nodeName: string;
        public applicationId: string;
        public partitionId: string;
        public serviceId: string;
        public activationId: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedReplicaViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" }
            });
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);

            this.nodeName = IdUtils.getNodeName(this.routeParams);
            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.activationId = IdUtils.getServicePackageActivationId(this.routeParams);
            this.partitionId = IdUtils.getPartitionId(this.routeParams);
            this.applicationId = IdUtils.getAppId(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(IdUtils.getAppId(this.routeParams)),
                IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
                IdGenerator.deployedReplicaGroup(),
                IdGenerator.deployedReplica(this.partitionId)
            ]);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getDeployedReplica(this.nodeName, this.applicationId, this.serviceId, this.activationId, this.partitionId, true, messageHandler)
                .then(deployedReplica => {
                    this.$scope.replica = deployedReplica;
                    const deployedService = this.$scope.replica.parent;
                    const deployedApplication = deployedService.parent;
                    const serviceName = encodeURI(this.$scope.replica.raw.ServiceName.replace("fabric:/", ""));
                    this.$scope.appView = this.data.routes.getReplicaViewPath(deployedApplication.raw.TypeName, deployedApplication.raw.Id, serviceName, 
                                                                              this.$scope.replica.raw.PartitionId ,this.$scope.replica.id)
                });
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.replica.detail.refresh(messageHandler);
        }
    }

    (function () {

        let module = angular.module("deployedReplicaViewController", ["ngRoute", "dataService"]);
        module.controller("DeployedReplicaViewController", ["$injector", "$scope", DeployedReplicaViewController]);

    })();
}
