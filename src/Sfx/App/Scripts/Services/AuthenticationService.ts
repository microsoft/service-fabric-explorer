//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class AuthenticationService {
        public isApplicationBootstrapped: boolean = false;

        private adalAuthenticationService: IAdalAuthenticationService;

        constructor($injector: angular.auto.IInjectorService,
            private $rootScope: IRootScopeServiceWithUserInfo,
            private clusterTree: ClusterTreeService,
            private refreshSvc: RefreshService,
            private authenticationData: AadMetadata) {

            if (this.needAadAuthentication) {
                this.adalAuthenticationService = $injector.get<IAdalAuthenticationService>("adalAuthenticationService");
            }

            if (this.needAadAuthentication && !this.isAadAuthenticated) {
                // Bootstrap the application after successfully login
                $rootScope.$on("adal:loginSuccess", () => {
                    console.log("adal:loginSuccess");
                    this.bootstrapApplication();
                });

                // Just for debugging purpose
                $rootScope.$on("adal:loginFailure", () => {
                    console.log("adal:loginFailure");
                });

                // Just for debugging purpose
                $rootScope.$on("adal:notAuthorized", () => {
                    console.log("adal:notAuthorized");
                });
            } else {
                this.bootstrapApplication();
            }
        }

        public get needAadAuthentication(): boolean {
            return this.authenticationData && this.authenticationData.isAadAuthType;
        }

        public get isAadAuthenticated(): boolean {
            return this.$rootScope.userInfo && this.$rootScope.userInfo.isAuthenticated;
        }

        public logOut(): void {
            if (this.adalAuthenticationService) {
                this.adalAuthenticationService.logOut();
            }
        }

        public bootstrapApplication(): void {
            // Initialize the tree
            this.clusterTree.init();

            // Initialize the refresh service
            this.refreshSvc.init();

            // Set bootstrapped flag
            this.isApplicationBootstrapped = true;

            // Refresh all controllers after initialization manually
            this.refreshSvc.refreshAll();
        }
    }

    (function () {

        let module = angular.module("authenticationService", []);
        module.factory("auth", ["$injector", "$rootScope", "clusterTree", "refresh", "authenticationData",
            ($injector, $rootScope, clusterTree, refresh, authenticationData) => new AuthenticationService($injector, $rootScope, clusterTree, refresh, authenticationData)]);

    })();
}
