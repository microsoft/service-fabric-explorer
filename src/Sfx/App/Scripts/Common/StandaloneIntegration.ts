//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class StandaloneIntegration {
        private static require: (moduleName: string) => any = window["nodeRequire"];

        private static _clusterUrl: string = null;

        public static get isStandalone(): boolean {
            return this.clusterUrl !== "";
        }

        public static get clusterUrl(): string {
            if (this._clusterUrl == null) {
                if (angular.isFunction(this.require)) {
                    this._clusterUrl = StandaloneIntegration.extractQueryItem(window.location.search, "targetcluster");
                } else {
                    this._clusterUrl = "";
                }
            }

            return StandaloneIntegration._clusterUrl;
        }

        private static extractQueryItem(queryString: string, name: string): string {
            if (queryString) {
                let urlParameters = window.location.search.split("?")[1];
                let queryParams = urlParameters.split("&");
                for (let i = 0; i < queryParams.length; i++) {
                    let queryParam = queryParams[i].split("=");
                    if (queryParam[0] === name) {
                        return queryParam[1];
                    }
                }
            }

            return null;
        }
    }
}
