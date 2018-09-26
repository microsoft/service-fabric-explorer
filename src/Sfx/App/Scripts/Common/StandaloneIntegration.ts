//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    declare const sfxModuleManager: {
        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): angular.IPromise<T>;
    };

    export class StandaloneIntegration {
        public static httpClient: angular.IHttpService;

        private static require: (moduleName: string) => any = window["nodeRequire"];

        private static _clusterUrl: string = null;

        public static isStandalone(): boolean {
            return sfxModuleManager !== null && sfxModuleManager !== undefined;
        }

        public static get clusterUrl(): string {

            if (this._clusterUrl == null) {
                if (angular.isFunction(this.require)) {
                    this._clusterUrl = this.require("electron").remote.getGlobal("TargetClusterUrl");
                } else {
                    this._clusterUrl = "";
                }
            }

            return StandaloneIntegration._clusterUrl;
        }

        public static getHttpClient(): angular.IPromise<any> {
            if (this.isStandalone()) {
                return sfxModuleManager.getComponentAsync("http.http-client.service-fabric");
            }

            return undefined;
        }
    }
}
