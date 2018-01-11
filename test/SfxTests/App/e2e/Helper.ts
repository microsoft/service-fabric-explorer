//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class Helper {

        // Be sure to call this after each case or after browser.get because in Chrome the localstorage is only available after that.
        public static clearLocalStorage() {
            browser.executeScript("window.localStorage.clear();");
        }

        public static checkForConsoleErrors() {

            browser.getCapabilities().then(function (capabilities) {
                if (capabilities.get("browserName") !== "internet explorer") {
                    browser.manage().logs().get("browser").then(function (browserLog) {
                        if (!browserLog) {
                            return;
                        }
                        console.log("Checking error logs...");

                        // Exclude any 404 errors
                        browserLog = browserLog.filter(log => {
                            return log.message.indexOf(" 404 ") < 0;
                        });
                        if (browserLog && browserLog.length > 0) {
                            let messages = "Console errors: ";
                            browserLog.forEach(entry => {
                                messages += "\r\n" + JSON.stringify(entry.toJSON());
                            });
                            fail(messages);
                        }
                    });
                }
            });
        }

        public static getUrl(baseUrl: string, path: string): string {
            if (/\/$/.test(baseUrl)) {
                return baseUrl + path;
            } else {
                return baseUrl + "/" + path;
            }
        }

        public static waitForUrlChange(currentUrl: string, timeout?: number) {
            return browser.wait(function () {
                return browser.getCurrentUrl().then(function (url) {
                    return url !== currentUrl;
                });
            }, timeout);
        };

        public static waitForElementToHaveClass(cssSelector, ...classes: string[]) {
            return browser.wait(function () {
                return Helper.hasClass(element(by.css(cssSelector)), ...classes);
            });
        };

        public static hasClass(element, ...classes: string[]): protractor.promise.Promise<boolean> {
            var deferred = protractor.promise.defer();
            element.getAttribute("class").then(function (classValue) {
                let clses = classValue.split(" ");
                classes.forEach(cls => {
                    if (clses.indexOf(cls) !== -1) {
                        deferred.fulfill(true);
                    }
                });
                deferred.fulfill(false);
            });
            return deferred.promise;
        };

        public static turnOffAutoRefresh() {
            element(by.id("slider-min-label")).click();
        }
    }
}
