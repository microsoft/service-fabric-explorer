//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("[Checkin] Local storage settings", () => {

        beforeEach(function () {
            browser.get(Helper.getUrl(browser.baseUrl, "#/apps"));
        });

        afterEach(function () {
            Helper.checkForConsoleErrors();
            Helper.clearLocalStorage();
        });

        it("slider should load default values", function () {
            element(by.id("refresh-rate-label")).getText().then(function (text) {
                expect(text).toBe(Constants.DefaultAutoRefreshInterval + "s");
            });
        });

        it("tree width should have default width", function () {
            element(by.id("tree")).getSize().then(function (size) {
                expect(size.width).toBe(Constants.DefaultSplitterLeftWidth);
            });
        });

        it("should persist the slider interval when refresh", function () {
            element(by.id("slider-max-label")).click();
            browser.wait(function () {
                return element(by.id("refresh-rate-label")).getText().then(function (maxLabelText) {
                    return maxLabelText !== Constants.DefaultAutoRefreshInterval + "s";
                });
            }, 5000);

            element(by.id("refresh-rate-label")).getText().then(function (maxLabelText) {
                browser.refresh().then(function () {
                    element(by.id("refresh-rate-label")).getText().then(function (text) {
                        expect(text).toBe(maxLabelText);
                    });
                });
            });
        });
    });
}
