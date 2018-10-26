//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface INetworksViewScope extends angular.IScope {
        networks: NetworkCollection;
        listSettings: ListSettings;
        actions: ActionCollection;
    }

    export class NetworksViewController extends MainViewController {
        constructor($injector: angular.auto.IInjectorService, public $scope: INetworksViewScope) {
            super($injector);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.networkGroup()
            ]);
            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("networks", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("type", "Type"),
                new ListColumnSetting("addressPrefix", "NetworkAddressPrefix"),
                new ListColumnSetting("status", "NetworkStatus")

            ]);
            this.$scope.actions = new ActionCollection(this.data.telemetry, this.$q);
            if (this.data.actionsEnabled) {
                this.addActions(this.$scope.actions);
            }
            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getNetworks(true, messageHandler)
                .then(networks => {
                    this.$scope.networks = networks;
                });
        }

        private addActions(actions: ActionCollection) {
            actions.add(new ActionCreateIsolatedNetwork(this.data));
        }
    };
    export class ActionCreateIsolatedNetwork extends ActionWithDialog {
        public networkName: string;
        public networkAddressPrefix: string;

        constructor(data: DataService) {

            super(
                data.$uibModal,
                data.$q,
                "createIsolatednetwork",
                "Create Isolated Network",
                "Creating",
                () => data.restClient.createNetwork(this.networkName, this.networkAddressPrefix),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/create-network-dialog.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                null);

            this.reset();
        }

        private reset(): void {
            this.networkName = "";
            this.networkAddressPrefix = "";
        }
    };

    (function () {

        let module = angular.module("networksViewController", []);
        module.controller("NetworksViewController", ["$injector", "$scope", NetworksViewController]);

    })();
}
