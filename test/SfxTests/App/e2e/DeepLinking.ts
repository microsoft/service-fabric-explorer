//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("[Checkin] Deep links", () => {

        beforeEach(function () {
            browser.get(Helper.getUrl(browser.baseUrl, "#/node/_Node_1/tab/details"))
        });

        afterEach(function () {
            Helper.checkForConsoleErrors();
            Helper.clearLocalStorage();
        });

        it("should take me to the specified tab", function () {
            element(by.css(".node.selected .tree-label")).getText().then(function (text) {
                expect(text).toBe("_Node_1");
            });

            element(by.css(".detail-view-navbar-tab a.active")).getText().then(function (text) {
                expect(text).toBe("DETAILS");
            });
        });

    });
}
