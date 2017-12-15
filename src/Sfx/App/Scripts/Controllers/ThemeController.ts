//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class ThemeController extends ControllerWithResolver {
        constructor($injector: angular.auto.IInjectorService, private themeSvc: ThemeService) {
            super($injector);
        }

        public getActiveThemeName(): string {
            return this.themeSvc.getActiveThemeName();
        }

        public changeToTheme(name: string): void {
            this.themeSvc.changeToTheme(name, true);
        }
    }

    (function () {

        let module = angular.module("themeController", ["themeService"]);
        module.controller("ThemeController", ["$injector", "theme", ThemeController]);

    })();
}
