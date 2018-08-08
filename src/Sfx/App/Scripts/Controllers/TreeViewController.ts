//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class TreeViewController extends ControllerWithResolver {
        private get tree(): TreeViewModel {
            return this.treeService.tree;
        }

        constructor($injector: angular.auto.IInjectorService, private treeService: ClusterTreeService, private searchService: SearchService) {
            super($injector);
        }
    }

    (function () {

        angular.module("treeViewController", ["clusterTreeService", "searchService"]).controller("TreeViewController", ["$injector", "clusterTree", "search", TreeViewController]);

    })();
}
