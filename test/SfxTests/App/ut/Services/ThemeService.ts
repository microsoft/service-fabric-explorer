//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    describe("Theme Service", () => {
        var theme: ThemeService;

        // Load module for testing
        beforeEach(angular.mock.module("themeService"));

        // Mock storage before load theme service
        beforeEach(function () {
            let mockStorageService = {
                getValueString: function () {
                    return "dark";
                }
            };
            angular.mock.module(function ($provide) {
                $provide.value("storage", mockStorageService);
            });
        });

        beforeEach(inject(function (_theme_) {
            // The injector unwraps the underscores (_) from around the parameter names when matching
            theme = _theme_;
        }));


        it("Should set to specified themes", () => {
            theme.changeToTheme("dark");
            expect(theme.getActiveThemeName()).toBe("dark");
            theme.changeToTheme("light");
            expect(theme.getActiveThemeName()).toBe("light");
        });


        it("Should resolve to correct VS themes", () => {
            theme.resolveAndChangeToTheme("vs", "dark");
            expect(theme.getActiveThemeName()).toBe("dark");
            theme.resolveAndChangeToTheme("vs", "light");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("vs", "blue");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("VS", "DARK");
            expect(theme.getActiveThemeName()).toBe("dark");
        });


        it("Should resolve to correct Azure themes", () => {
            theme.resolveAndChangeToTheme("azure", "dark");
            expect(theme.getActiveThemeName()).toBe("dark");
            theme.resolveAndChangeToTheme("azure", "light");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("azure", "blue");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("azure", "azure");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("Azure", "LIGHT");
            expect(theme.getActiveThemeName()).toBe("light");
        });


        it("Should not change with unknown source or theme name", () => {
            theme.changeToTheme("light");
            theme.resolveAndChangeToTheme("vs", "foo");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme("azure", "bar");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme(null, "foo");
            expect(theme.getActiveThemeName()).toBe("light");
            theme.resolveAndChangeToTheme(null, null);
            expect(theme.getActiveThemeName()).toBe("light");
        });

    });
}


