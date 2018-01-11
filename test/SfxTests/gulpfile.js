/// <reference path="../../src/sfx/app/scripts/common/constants.ts" />
/// <binding BeforeBuild="build" />

var gulp = require("gulp");
var plugins = require("gulp-load-plugins")({
    pattern: ["*", "!protractor", "!bower", "!typescript"],
    camelize: true,
    lazy: true
});

//-----------------------------------------------------------------------------
// Paths
//-----------------------------------------------------------------------------

// Base paths
var paths = {
    webroot: "wwwroot/"
};

// Specs
paths.specs = {
    ut: {
        src: "App/ut/**/*.ts",
        tsConfig: "App/ut/tsconfig.json",
        target: "ut.specs.js",
        dest: paths.webroot
    },
    e2e: {
        src: "App/e2e/**/*.ts",
        tsConfig: "App/e2e/tsconfig.json",
        target: "e2e.specs.js",
        dest: paths.webroot
    }
};

//-----------------------------------------------------------------------------
// Build tasks
//-----------------------------------------------------------------------------

gulp.task("build-ut", function () {
    buildSpec(paths.specs.ut);
});

gulp.task("build-e2e", function () {
    buildSpec(paths.specs.e2e);
});

gulp.task("clean-build", ["clean", "build-ut", "build-e2e"]);

function buildSpec(path) {
    var tsProject = plugins.typescript.createProject(path.tsConfig, { outFile: path.target });

    return tsProject.src()
        .pipe(plugins.sourcemaps.init())
        .pipe(tsProject())
        .pipe(plugins.sourcemaps.write(".", { includeContent: true }))
        .pipe(gulp.dest(path.dest));
}

//-----------------------------------------------------------------------------
// Clean tasks
//-----------------------------------------------------------------------------
gulp.task("clean", function () {
    return plugins.del.sync([paths.webroot, "results"]);
});

//-----------------------------------------------------------------------------
// Watch tasks
//-----------------------------------------------------------------------------
gulp.task("watch-test", ["clean-build"], function () {
    gulp.watch(paths.specs.ut.src, ["build-ut"]);
    gulp.watch(paths.specs.e2e.src, ["build-e2e"]);
});

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

// For debugging purposes
gulp.task("karma", function (done) {
    launchKarma(false, done);
});

// Run unit tests
gulp.task("ut", ["build-ut"], function (done) {
    launchKarma(true, done, ["Chrome", "IE"], ["spec", "html"]);
});

gulp.task("automation:unittests", ["build-ut"], function (done){
    launchKarma(true, done, ["IE_no_addons", "Chrome_without_security"], ["spec", "junit"]);
});

// Downloads the selenium webdriver
gulp.task("webdriver_update", plugins.protractor.webdriver_update_specific({
    browsers: ["chrome", "ie32"]
}));

// Start the standalone selenium server
gulp.task("webdriver_standalone", ["webdriver_update"], plugins.protractor.webdriver_standalone);

// Run E2E tests
gulp.task("e2e", ["build-e2e", "webdriver_update"], function (cb) {
    gulp.src([])
        .pipe(plugins.protractor.protractor({
            configFile: "protractor.conf.js"
        }))
        .on("error", function (e) {
            console.log(e);
        });
});

function launchKarma(singleRun, done, browsers, reporters) {
    new plugins.karma.Server({
        configFile: __dirname + "/karma.conf.js",
        browsers: browsers,
        reporters: reporters,
        singleRun: singleRun
    }, function (err) {
        done();
        process.exit(err ? 1 : 0);
    }).start();
}