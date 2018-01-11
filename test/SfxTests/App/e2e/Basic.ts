//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------


module Sfx {

    describe("[Checkin] Basic page loading", () => {

        beforeEach(function () {
            browser.get(browser.baseUrl);
        });

        afterEach(function () {
            Helper.checkForConsoleErrors();
            Helper.clearLocalStorage();
        });

        it("should have a title", function () {
            expect(browser.getTitle()).toEqual("Service Fabric Explorer");
        });

        it("should load the tree", function () {
            element.all(by.css(".node .self")).then(function (elements) {
                // Cluster
                //   - Applications
                //   - Nodes
                //   - System
                expect(elements.length === 4);

                elements[0].getText().then(function (text) {
                    expect(text).toBe("Cluster");
                });

                elements[1].getText().then(function (text) {
                    expect(text).toBe("Applications");
                });

                elements[2].getText().then(function (text) {
                    expect(text).toBe("Nodes");
                });

                elements[3].getText().then(function (text) {
                    expect(text).toBe("System");
                });
            });
        });
    });
}
