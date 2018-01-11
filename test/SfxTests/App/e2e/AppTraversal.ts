//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("[Checkin] App travesal", () => {

        beforeEach(function () {
            browser.get(browser.baseUrl);
        });

        afterEach(function () {
            Helper.checkForConsoleErrors();
            Helper.clearLocalStorage();
        });

        var selectNextNode = function () {
            var expander = element(by.css(".tree-body .node.selected > .self > .expander"));
            return expander.isDisplayed().then(function (isDisplayed) {
                var selectedNode = element(by.css(".tree-body .node.selected"));

                if (isDisplayed) {
                    // Expand the node first
                    expander.click();

                    // Wait for the node to expand
                    Helper.waitForElementToHaveClass(".tree-body .node.selected > .self > .expander", "ng-hide", "bowtie-chevron-down-light");

                } else {
                    // No expander to click, click on the element to set the focus
                    selectedNode.click();
                }

                console.log("Before getting selected element");
                return browser.getCurrentUrl().then(function (previousUrl) {
                    // Move the focus down and wait for url change
                    browser.actions().sendKeys(protractor.Key.ARROW_DOWN).perform();
                    return Helper.waitForUrlChange(previousUrl, 5000).then(null, function () {
                        console.log("Cannot detect URL change. Exiting.");
                    });
                });
            });
        };

        var testPageTabs = function (previousUrl) {
            return browser.getCurrentUrl().then(function (url) {
                console.log("Testing Page: " + url);
                if (url !== previousUrl) {
                    var index = 0;
                    return element.all(by.css(".detail-view-navbar-tab a")).count().then(function (count) {
                        var activeTab = element(by.css(".detail-view-navbar-tab a.active"));

                        for (var i = 0; i < count; i++) {
                            var tab = element.all(by.css(".detail-view-navbar-tab a")).get(i);
                            if (tab !== activeTab) {
                                tab.getText().then(function (text) {
                                    console.log("Clicking on tab: " + text);
                                });
                                // Click on the tab and wait for page to load
                                tab.click();
                                Helper.waitForElementToHaveClass(".detail-view-navbar-tab:nth-child(" + (2 * i + 1) + ") a", "active");
                            }
                        }

                        // Test next node
                        return selectNextNode().then(function () {
                            return testPageTabs(url);
                        });
                    });
                }
            });
        };

        it("Should be able to expand all tree nodes and click on all tabs without console errors",
            function () {
                Helper.turnOffAutoRefresh();

                // Focus on the selected node of the tree by clicking the node
                element(by.css(".tree-body .node.selected > .self")).click();

                // Collapse the root node to start testing
                browser.actions().sendKeys(protractor.Key.ARROW_LEFT).perform();

                // Start to test pages
                testPageTabs(null);
            },
            60 * 60 * 1000);
    });
}

