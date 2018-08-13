//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------


module Sfx {
    export class SearchService {
        constructor(
            private $q: angular.IQService,
            private data: DataService,
            private routes: RoutesService) {
        }

        public search(term: string): angular.IPromise<SearchResult[]> {
            let results: SearchResult[] = [];
            let tasks: angular.IPromise<void>[] = [];

            tasks.push(this.data.getApps().then(apps => {
                results = results.concat(_.map(_.filter(apps.collection, app => app.raw.Name.indexOf(term) >= 0), app => new SearchResult("Application", app.raw.Name, this.routes.getAppViewPath(app.raw.TypeName, app.raw.Id))));
            }));

            tasks.push(this.data.getNodes().then(nodes => {
                results = results.concat(_.map(_.filter(nodes.collection, node => node.raw.Name.indexOf(term) >= 0), node => new SearchResult("Node", node.raw.Name, this.routes.getNodeViewPath(node.raw.Name))));
            }));

            return this.$q.all(tasks).then(() => results);
        }
    }

    export class SearchResult {
        constructor (public type: string, public name: string, public route: string) {
        }
    }

    (function () {
        let module = angular.module("searchService", ["ng", "ngSanitize", "dataService", "routes"]);
        module.factory("search", ["$q", "data", "routes", ($q, data, routes) => new SearchService($q, data, routes)]);
    })();
}
