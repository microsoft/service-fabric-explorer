//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

// Karma configuration
// Generated on Tue Jan 05 2016 15:52:42 GMT-0800 (Pacific Standard Time)
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: "",


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ["jasmine"],


        // list of files / patterns to load in the browser
        files: [
            // Application libraries and code
            "../../src/Sfx/wwwroot/js/lib.min.js",
            "../../src/Sfx/wwwroot/js/templates.min.js",
            "../../src/Sfx/wwwroot/js/app.min.js",

            // Unit test libraries
            "node_modules/angular-mocks/angular-mocks.js",

            // Application code and specs
            "wwwroot/ut.specs.js"
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            "**/*.js": ["sourcemap"]
        },


        // test results reporter to use
        // possible values: "dots", "progress"
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ["spec", "html", "junit"],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["IE_no_addons", "Chrome_without_security"],
        customLaunchers: {
            IE_no_addons: {
                base: "IE",
                flags: ["-extoff"]
            },
            Chrome_without_security: {
                base: "ChromeHeadless",
                flags: ["--test-type", "--disable-web-security", "--no-sandbox"]
            }
        },

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        htmlReporter: {
            outputFile: "results/karma_report.html"
        },

        junitReporter: {
            outputDir: "results"
        }
    });
};
