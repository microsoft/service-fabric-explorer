//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class ThemeService extends Observable {

        private currentThemeName: string;

        public constructor(private storage: StorageService) {
            super();

            this.currentThemeName = storage.getValueString(Constants.ThemeNameStorageKey, Constants.DefaultThemeName);
        }

        public getActiveThemeName(): string {
            return this.currentThemeName;
        }

        public changeToTheme(name: string, saveAsUserPreference: boolean = false): void {
            if (name !== this.currentThemeName) {
                let oldThemeName = this.currentThemeName;
                this.currentThemeName = name;
                this.notify(Constants.ThemeNameMonitorPropertyName, oldThemeName, name);
                if (saveAsUserPreference) {
                    // Save the theme name in local storage
                    this.storage.setValue(Constants.ThemeNameStorageKey, name);
                }
            }
        }

        public resolveAndChangeToTheme(themeSrc: string, themeName: string): void {
            if (!_.isString(themeSrc) || !themeSrc || !_.isString(themeName) || !themeName) {
                return;
            }

            themeSrc = themeSrc.toLowerCase();
            themeName = themeName.toLowerCase();

            let matchingThemeName = "";
            switch (themeSrc) {
                case "vs":
                    matchingThemeName = this.resolveVsTheme(themeName);
                    break;
                case "azure":
                    matchingThemeName = this.resolveAzureTheme(themeName);
                    break;
            }

            if (!matchingThemeName) {
                console.log("Unrecognized theme source '" + themeSrc + "' and theme name '" + themeName + "'.");
                return;
            }

            // Temporary theme change for current session ONLY, do not save as user preference
            this.changeToTheme(matchingThemeName, false /* do NOT save as user preference */);
        }

        private resolveVsTheme(vsThemeName: string): string {
            switch (vsThemeName) {
                case "blue":
                case "light":
                    return "light";
                case "dark":
                    return "dark";
                default:
                    return "";
            }
        }

        private resolveAzureTheme(azureThemeName: string): string {
            switch (azureThemeName) {
                case "azure":
                case "blue":
                case "light":
                    return "light";
                case "dark":
                    return "dark";
                default:
                    return "";
            }
        }
    }

    (function () {

        let module = angular.module("themeService", ["storageService"]);
        module.factory("theme", ["storage", (storage) => new ThemeService(storage)]);

    })();
}
