//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface INetworkViewScope extends angular.IScope {
        network: Network;
        listSettings: ListSettings;
        apps: AppOnNetworkCollection;
        appListSettings: ListSettings;
        nodes: NodeOnNetworkCollection;
        nodeListSettings: ListSettings;
        containers: DeployedContainerOnNetworkCollection;
        containerListSettings: ListSettings;
    }

    export class NetworkViewController extends MainViewController {
        public networkName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: INetworkViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["details"].refresh = (messageHandler) => this.refreshCommon(messageHandler);
            this.networkName = IdUtils.getNetworkName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.networkGroup(),
                IdGenerator.network(this.networkName)
            ]);
            console.log("where am i");
            this.$scope.appListSettings = this.settings.getNewOrExistingListSettings("apps", ["appDetail.raw.Name"], [
                new ListColumnSettingForLink("appDetail.raw.Name", "Application Name", item => item.viewPath),
                new ListColumnSetting("appDetail.raw.TypeName", "Application Type"),
                new ListColumnSettingForBadge("appDetail.healthState", "Health State"),
                new ListColumnSetting("appDetail.raw.Status", "Status"),
            ]);
            this.$scope.apps = new AppOnNetworkCollection(this.data, this.networkName);
            console.log("where am i 2");
            this.$scope.nodeListSettings = this.settings.getNewOrExistingListSettings("nodes", ["nodeDetails.name"], [
                new ListColumnSettingForLink("nodeDetails.name", "Name", item => item.viewPath),
                new ListColumnSetting("nodeDetails.raw.IpAddressOrFQDN", "Address"),
                new ListColumnSettingWithFilter("nodeDetails.raw.Type", "Node Type"),
                new ListColumnSettingWithFilter("nodeDetails.raw.UpgradeDomain", "Upgrade Domain"),
                new ListColumnSettingWithFilter("nodeDetails.raw.FaultDomain", "Fault Domain"),
                new ListColumnSettingWithFilter("nodeDetails.raw.IsSeedNode", "Is Seed Node"),
                new ListColumnSettingForBadge("nodeDetails.healthState", "Health State"),
                new ListColumnSettingWithFilter("nodeDetails.nodeStatus", "Status"),
            ]);
            this.$scope.nodes = new NodeOnNetworkCollection(this.data, this.networkName);
            this.$scope.containerListSettings = this.settings.getNewOrExistingListSettings("containers", ["nodeName", "raw.CodePackageName"], [
                new ListColumnSettingForLink("raw.CodePackageName", "Code Package Name", item => item.viewPath),
                new ListColumnSetting("nodeName", "Node Name"),
                new ListColumnSetting("raw.NetworkName", "Network"),
                new ListColumnSetting("raw.ApplicationName", "Application"),
                new ListColumnSetting("raw.CodePackageVersion", "Version"),
                new ListColumnSetting("raw.ServiceManifestName", "Service"),
                new ListColumnSetting("raw.ServicePackageActivationId", "Activation Id"),
                new ListColumnSetting("raw.ContainerAddress", "Container addresses"),
                new ListColumnSetting("raw.ContainerId", "Container Id")

            ]);
            this.$scope.containers = new DeployedContainerOnNetworkCollection(this.data, this.networkName);
            this.refresh();
            console.log("constructor ends");
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getNetwork(this.networkName, true, messageHandler)
                .then(network => {
                    this.$scope.network = network;
                    console.log("NetworkViewController refresh common");
                });
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {

            return this.$q.all([
                this.$scope.apps.refresh(messageHandler),
                this.$scope.nodes.refresh(messageHandler),
                this.$scope.containers.refresh(messageHandler)
            ]);
        }
    }

    (function () {

        let module = angular.module("networkViewController", ["ngRoute", "dataService"]);
        module.controller("NetworkViewController", ["$injector", "$scope", NetworkViewController]);

    })();
}
