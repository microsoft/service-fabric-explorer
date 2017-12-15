//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
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
                    this._clusterUrl = this.require("electron").remote.getGlobal("TargetClusterUrl");
                } else {
                    this._clusterUrl = "";
                }
            }

            return StandaloneIntegration._clusterUrl;
        }

    }
}
