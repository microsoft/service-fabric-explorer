//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class TreeViewController extends ControllerWithResolver {
        private treeService: ClusterTreeService;

        private get tree(): TreeViewModel {
            return this.treeService.tree;
        }

        constructor($injector: angular.auto.IInjectorService) {
            super($injector);

            this.treeService = $injector.get<ClusterTreeService>("clusterTree");
        }
    }

    (function () {

        let module = angular.module("treeViewController", []);

        module.controller("TreeViewController", ["$injector", TreeViewController]);
    })();
}
