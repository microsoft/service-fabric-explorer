var HtmlScreenshotReporter = require("protractor-jasmine2-screenshot-reporter");
var SpecReporter = require("jasmine-spec-reporter").SpecReporter;

var htmlReporter = new HtmlScreenshotReporter({
    dest: "../../artifacts/TestReports",
    filename: "protractor_report.html",
    reportOnlyFailedSpecs: false,
    captureOnlyFailedSpecs: true,
    showSummary: true,
    showConfiguration: true,
    reportTitle: "SFX E2E Test Report",
    preserveDirectory: true,
    pathBuilder: function (currentSpec, suites, browserCapabilities) {
        // will return chrome/your-spec-name.png
        return browserCapabilities.get("browserName") + "/" + currentSpec.fullName;
    }
});

exports.config = {
    framework: "jasmine2",
    baseUrl: "http://localhost:19080/Explorer",
    seleniumAddress: "http://localhost:4444/wd/hub",
    specs: ["wwwroot/e2e.specs.js"],
    allScriptsTimeout: 90000,
    getPageTimeout: 90000,
    multiCapabilities: [{
        browserName: "chrome",
        loggingPrefs: {
            "browser": "SEVERE"
        },
        chromeOptions: {
            args: ['--no-sandbox', '--test-type=browser']
        }
    }],

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 90000,
        includeStackTrace: true
    },

    beforeLaunch: function () {
        return new Promise(function (resolve) {
            htmlReporter.beforeLaunch(resolve);
        });
    },

    onPrepare: function () {
        // Add spec reporter
        jasmine.getEnv().addReporter(new SpecReporter({ displayStacktrace: true }));

        // Add html reporter
        jasmine.getEnv().addReporter(htmlReporter);

        // Set window size to show all SFX elements
        browser.manage().window().setSize(1280, 1024);
    },

    // Close the report after all tests finish
    afterLaunch: function (exitCode) {
        return new Promise(function (resolve) {
            htmlReporter.afterLaunch(resolve.bind(this, exitCode));
        });
    }
};