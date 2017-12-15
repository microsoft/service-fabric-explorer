//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface INodesViewScope extends angular.IScope {
        nodes: NodeCollection;
        listSettings: ListSettings;
    }

    export class NodesViewController extends MainViewController {
        constructor($injector: angular.auto.IInjectorService, public $scope: INodesViewScope) {
            super($injector);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup()
            ]);
            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("nodes", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.IpAddressOrFQDN", "Address"),
                new ListColumnSetting("raw.Type", "Node Type"),
                new ListColumnSetting("raw.UpgradeDomain", "Upgrade Domain"),
                new ListColumnSetting("raw.FaultDomain", "Fault Domain"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("nodeStatus", "Status"),
            ]);
            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getNodes(true, messageHandler)
                .then(nodes => {
                    this.$scope.nodes = nodes;
                });
        }
    };

    (function () {

        let module = angular.module("nodesViewController", []);
        module.controller("NodesViewController", ["$injector", "$scope", NodesViewController]);

    })();
}
