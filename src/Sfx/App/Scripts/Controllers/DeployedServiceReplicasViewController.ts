//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDeployedServiceReplicasViewScope extends angular.IScope {
        replicas: DeployedReplicaCollection;
        listSettings: ListSettings;
    }

    export class DeployedServiceReplicasViewController extends MainViewController {
        public nodeName: string;
        public appId: string;
        public serviceId: string;
        public activationId: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IDeployedServiceReplicasViewScope) {
            super($injector);

            this.nodeName = IdUtils.getNodeName(this.routeParams);
            this.appId = IdUtils.getAppId(this.routeParams);
            this.serviceId = IdUtils.getServiceId(this.routeParams);
            this.activationId = IdUtils.getServicePackageActivationId(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName),
                IdGenerator.deployedApp(this.appId),
                IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
                IdGenerator.deployedReplicaGroup()
            ]);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getDeployedReplicas(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
                .then(replicas => {
                    this.$scope.replicas = replicas;

                    if (!this.$scope.listSettings && replicas.length > 0) {
                        let replica = _.first(replicas.collection);
                        let defaultSortProperties = ["replicaRoleSortPriority", "id"];
                        let columnSettings = [
                            new ListColumnSettingForLink("id", "Id", item => item.viewPath),
                            new ListColumnSetting("raw.PartitionId", "Partition Id"),
                            new ListColumnSettingWithFilter("raw.ServiceKind", "Service Kind"),
                            new ListColumnSettingWithFilter("role", "Replica Role", defaultSortProperties),
                            new ListColumnSettingWithFilter("raw.ReplicaStatus", "Status")
                        ];

                        if (replica.isStatelessService) {
                            columnSettings.splice(3, 1); // Remove replica role column
                            defaultSortProperties = ["id"];
                        }

                        if (_.some(replicas.collection, cp => cp.servicePackageActivationId)) {
                            columnSettings.splice(1, 0, new ListColumnSetting("servicePackageActivationId", "Service Package Activation Id"));
                        }

                        // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
                        this.$scope.listSettings = this.settings.getNewOrExistingListSettings("replicas", defaultSortProperties, columnSettings);
                    }
                });
        }
    }

    (function () {

        let module = angular.module("deployedServiceReplicasViewController", []);
        module.controller("DeployedServiceReplicasViewController", ["$injector", "$scope", DeployedServiceReplicasViewController]);

    })();
}
