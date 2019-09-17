//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class SettingsController extends ControllerWithResolver {
        public advancedModeState: boolean;

        constructor($injector: angular.auto.IInjectorService) {
            super($injector);
            this.advancedModeState = this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
        }

        public setPaginationLimit(limit: number) {
            this.settings.paginationLimit = limit;
        }

        public setAdvancedMode() {
            this.storage.setValue(Constants.AdvancedModeKey, this.advancedModeState);

            this.data.getNodes().then(nodeCollection => {
                nodeCollection.setAdvancedMode(this.advancedModeState);
            });
        }
    }

    (function () {

        let module = angular.module("settingsController", ["settingsService", "storageService", "dataService"]);
        module.controller("SettingsController", ["$injector", "settings", "storage", "data", SettingsController]);

    })();
}
