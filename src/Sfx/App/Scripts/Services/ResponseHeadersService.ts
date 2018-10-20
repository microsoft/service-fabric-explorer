//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class ResponseHeadersService {

        constructor(private $rootScope: angular.IRootScopeService, private $location: angular.ILocationService) {
            if (this.$rootScope[Constants.SfxClusterNameMetadataName] === undefined) {
                if (StandaloneIntegration.isStandalone()) {
                    let url = new URL(StandaloneIntegration.clusterUrl);

                    this.$rootScope[Constants.SfxClusterNameMetadataName] = url.protocol + "//" + url.hostname;
                } else {
                    this.$rootScope[Constants.SfxClusterNameMetadataName] = this.$location.protocol() + "://" + this.$location.host();
                }
            }
        }

        //Method name should be exactly "response" - http://docs.angularjs.org/api/ng/service/$http
        public response = (response) => {
            if (response.headers(Constants.SfxReadonlyHeaderName) !== null) {
                this.$rootScope[Constants.SfxReadonlyMetadataName] = response.headers(Constants.SfxReadonlyHeaderName) === "1";
            }

            if (response.headers(Constants.SfxClusterNameHeaderName) !== null) {
                this.$rootScope[Constants.SfxClusterNameMetadataName] = response.headers(Constants.SfxClusterNameHeaderName);
            }

            return response;
        }
    }

    (function () {

        let module = angular.module("responseHeadersService", []);
        module.factory("responseHeaders", ["$rootScope", "$location", ($rootScope, $location) => new ResponseHeadersService($rootScope, $location)]);
        module.config(["$httpProvider", function ($httpProvider: ng.IHttpProvider) {
            $httpProvider.interceptors.push("responseHeaders");
        }]);
    })();
}
