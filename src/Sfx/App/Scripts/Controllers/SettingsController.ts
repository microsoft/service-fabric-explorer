//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class SettingsController extends ControllerWithResolver {
        constructor($injector: angular.auto.IInjectorService) {
            super($injector);
        }

        public setPaginationLimit(limit: number) {
            this.settings.paginationLimit = limit;
        }
    }

    (function () {

        let module = angular.module("settingsController", ["settingsService"]);
        module.controller("SettingsController", ["$injector", "settings", SettingsController]);

    })();
}
