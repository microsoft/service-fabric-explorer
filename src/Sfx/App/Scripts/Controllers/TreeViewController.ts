//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class TreeViewController extends ControllerWithResolver {
        private searchResults: SearchResult[] = [];
        private get tree(): TreeViewModel {
            return this.treeService.tree;
        }

        private get searchTree(): SearchTreeViewModel {
            return this.treeService.searchTree;
        }

        private isSearching: boolean = false;

        constructor($injector: angular.auto.IInjectorService, private treeService: ClusterTreeService, private searchService: SearchService) {
            super($injector);
        }

        private onSearchBoxKeyDown(event) {
            if (event.key === "Enter") {
                this.search();
            }
        }

        private search() {
            if (this.searchTree.searchTerm) {
                this.isSearching = true;
                this.searchTree.search();
            }
        }

        private resetSearch(): void {
            this.isSearching = false;
        }
    }

    (function () {

        angular.module("treeViewController", ["clusterTreeService", "searchService"]).controller("TreeViewController", ["$injector", "clusterTree", "search", TreeViewController]);

    })();
}
