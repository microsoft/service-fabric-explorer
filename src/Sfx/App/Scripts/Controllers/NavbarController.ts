//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
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

        public openPrivacyLink(): void {
            this.$window.open("http://go.microsoft.com/fwlink/?LinkId=512132", "_blank");
        }

        public openSuggestionLink(): void {
            this.$window.open("http://aka.ms/servicefabricfeedback", "_blank");
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
