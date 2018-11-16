//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IRootScopeServiceWithUserInfo extends angular.IRootScopeService {
        userInfo: IUserInfo;
    }

    export class AuthenticationController extends ControllerWithResolver {
        constructor($injector: angular.auto.IInjectorService, private $rootScope: IRootScopeServiceWithUserInfo) {
            super($injector);
        }

        public get isApplicationBootstrapped(): boolean {
            return this.authSvc.isApplicationBootstrapped;
        }

        public get isAadAuthenticated(): boolean {
            return this.authSvc.isAadAuthenticated;
        }

        public get isStandalone(): boolean {
            return StandaloneIntegration.isStandalone();
        }

        public get userName(): string {
            if (this.$rootScope.userInfo) {
                if (this.$rootScope.userInfo.profile && this.$rootScope.userInfo.profile.name) {
                    return this.$rootScope.userInfo.profile.name;
                } else if (this.$rootScope.userInfo.userName) {
                    return this.$rootScope.userInfo.userName;
                }
            }
            return "";
        }

        public get brandTitle(): string {
            return "Service Fabric Explorer" + (this.isStandalone ? " - " + StandaloneIntegration.clusterDisplayName : "");
        }

        public logOut(): void {
            this.authSvc.logOut();
        }
    }

    (function () {

        let module = angular.module("authenticationController", []);
        module.controller("AuthenticationController", ["$injector", "$rootScope", AuthenticationController]);

    })();
}
