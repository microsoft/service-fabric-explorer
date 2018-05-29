//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class NavbarController {

        constructor(private refreshSvc: RefreshService, private routes: RoutesService, private $window: angular.IWindowService) {
        }

        public get isRefreshing(): boolean {
            return this.refreshSvc.isRefreshing;
        }

        public refreshAll(): void {
            this.refreshSvc.refreshAll();
        }

        public navigateToCluster(): void {
            this.routes.navigate(() => this.routes.getClusterViewPath());
        }
    }

    (function () {

        let module = angular.module("navbarController", ["refreshService", "routes"]);
        module.controller("NavbarController", ["refresh", "routes", "$window", NavbarController]);

    })();
}
