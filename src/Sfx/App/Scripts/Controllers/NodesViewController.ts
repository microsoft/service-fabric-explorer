//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface INodesViewScope extends angular.IScope {
        nodes: NodeCollection;
        listSettings: ListSettings;
        nodeEvents: NodeEventList;
        nodeEventTimelineGenerator: NodeTimelineGenerator;
    }

    export class NodesViewController extends MainViewController {
        constructor($injector: angular.auto.IInjectorService, public $scope: INodesViewScope) {
            super($injector, {
                "nodes": { name: "All Nodes" },
                "events": { name: "Events" }
            });
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup()
            ]);
            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("nodes", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.IpAddressOrFQDN", "Address"),
                new ListColumnSettingWithFilter("raw.Type", "Node Type"),
                new ListColumnSettingWithFilter("raw.UpgradeDomain", "Upgrade Domain"),
                new ListColumnSettingWithFilter("raw.FaultDomain", "Fault Domain"),
                new ListColumnSettingWithFilter("raw.IsSeedNode", "Is Seed Node"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("nodeStatus", "Status"),
            ]);
            this.$scope.nodeEvents = this.data.createNodeEventList(null);
            this.$scope.nodeEventTimelineGenerator = new NodeTimelineGenerator();

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getNodes(true, messageHandler)
                .then(nodes => {
                    this.$scope.nodes = nodes;
                });
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.nodeEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }
    };

    (function () {

        let module = angular.module("nodesViewController", []);
        module.controller("NodesViewController", ["$injector", "$scope", NodesViewController]);

    })();
}
