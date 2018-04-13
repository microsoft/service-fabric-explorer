//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export enum NodeStatus {
        Invalid = 0,
        Up = 1,
        Down = 2,
        Enabling = 3,
        Disabling = 4,
        Disabled = 5
    }

    export interface INodeViewScope extends angular.IScope {
        node: Node;
        deployedApps: DeployedApplicationCollection;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        nodeEvents: NodeEventList;
    }

    export class NodeViewController extends MainViewController {
        public nodeName: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: INodeViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "events": { name: "Events" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            this.nodeName = IdUtils.getNodeName(this.routeParams);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.nodeGroup(),
                IdGenerator.node(this.nodeName)
            ]);

            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("apps", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Application Type"),
                new ListColumnSettingForBadge("health.healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.Status", "Status"),
            ]);
            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.nodeEvents = this.data.createNodeEventList(this.nodeName);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getNode(this.nodeName, true, messageHandler)
                .then(node => {
                    this.$scope.node = node;

                    return this.$scope.node.health.refresh(messageHandler);
                });
        }

        private refreshDetails(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.node.loadInformation.refresh(messageHandler);
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.node.deployedApps.refresh(messageHandler).then(deployedApps => {
                this.$scope.deployedApps = deployedApps;
            });
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.nodeEvents.refresh(messageHandler);
        }
    }

    (function () {

        let module = angular.module("nodeViewController", ["ngRoute", "dataService"]);
        module.controller("NodeViewController", ["$injector", "$scope", NodeViewController]);

    })();
}
