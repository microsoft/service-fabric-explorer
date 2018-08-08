//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
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

        angular.module("themeController", ["themeService"]).controller("ThemeController", ["$injector", "theme", ThemeController]);

    })();
}
