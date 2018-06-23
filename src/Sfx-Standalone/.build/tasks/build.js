//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const utilities = require("../utilities");
const config = require("../config");
const tsc = require("../tsc");

const ts = require("typescript");
const gulp = require("gulp");
const gtslint = require("gulp-tslint");
const tslint = require("tslint");
const globby = require("globby");
const fs = require("fs");

const buildInfos = config.buildInfos;

/**
 * The the globs for the typescript files.
 * @returns {Array.<string>} The globs for the typescript files.
 */
function getTypescriptsGlobs() {
    const tsconfig = config.tsConfig;

    /** @type {Array.<string>} */
    const globs = [];

    // Include
    if (Array.isArray(tsconfig.include)) {
        globs.push(...tsconfig.include);
    } else if (!isNullOrUndefined(tsconfig.include)) {
        throw new Error("tsconfig.include must be an array!");
    }

    // Exclude
    if (Array.isArray(tsconfig.exclude)) {
        tsconfig.exclude.forEach((pattern) => globs.push("!" + pattern));
    } else if (!isNullOrUndefined(tsconfig.include)) {
        throw new Error("tsconfig.exclude must be an array!");
    }

    return utilities.formGlobs(globs);
}

require("./clean");
require("./build.sdk");

gulp.task("build:ts@lint",
    () =>
        gulp.src(getTypescriptsGlobs())
            .pipe(gtslint({ program: tslint.Linter.createProgram("./tsconfig.json") }))
            .pipe(gtslint.report({ summarizeFailureOutput: true })));

gulp.task("build:ts@compile",
    () => new Promise((resolve, reject) => {
        try {
            const tsconfig = config.tsConfig;
            const compilterOptionsParseResult = ts.convertCompilerOptionsFromJson(tsconfig.compilerOptions, undefined);

            if (Array.isArray(compilterOptionsParseResult.errors)
                && compilterOptionsParseResult.errors.length > 0) {

                compilterOptionsParseResult.errors.forEach((error) => tsc.logDiagnostic(error));
                throw new Error("Failed to load typescript compiler options.");
            }

            compilterOptionsParseResult.options.outDir = buildInfos.paths.appDir;

            if (process.argv.indexOf("--production") >= 0) {
                compilterOptionsParseResult.options.sourceMap = false;
            }

            tsc.compile(
                compilterOptionsParseResult.options,
                globby.sync(getTypescriptsGlobs(), { dot: true }));

            resolve();
        } catch (exception) {
            reject(exception);
        }
    }));

gulp.task("build:ts",
    gulp.series("build:ts@lint", "build:ts@compile"));

gulp.task("build:html",
    () =>
        gulp.src(utilities.formGlobs("**/*.html"))
            .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:img",
    () =>
        gulp.src(utilities.formGlobs(["icons/**/*.*"]))
            .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:json",
    () =>
        gulp.src(utilities.formGlobs(["**/*.json"]))
            .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:node_modules",
    () => utilities.appdirExec("npm install --production"));

gulp.task("build:sfx",
    () => {
        if (!fs.existsSync("../Sfx/wwwroot")) {
            throw new Error("Missing Sfx build: Please first run 'gulp clean-build' under /src/Sfx.");
        }

        return gulp.src(["../Sfx/wwwroot/**/*.*"])
            .pipe(gulp.dest(buildInfos.paths.sfxDir))
    });

gulp.task("build:sfx@debug",
    (done) => {
        if (fs.existsSync(buildInfos.paths.sfxDir)) {
            return Promise.resolve();
        }

        return gulp.task("build:sfx")(done);
    });

gulp.task("build:licenses",
    () =>
        gulp.src(utilities.formGlobs(["LICENSE"]))
            .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build",
    gulp.parallel(
        "build:sfx",
        "build:ts",
        "build:html",
        "build:json",
        "build:img"));

gulp.task("build:debug",
    gulp.parallel(
        "build:sfx@debug",
        "build:ts@compile",
        "build:html",
        "build:json",
        "build:img"));

gulp.task("build:all",
    gulp.series(
        gulp.parallel(
            "build",
            "build:licenses"),
        "build:node_modules",
        "build:sdk"));

gulp.task("clean-build",
    gulp.series("clean:build", "build"));

gulp.task("clean-build:all",
    gulp.series("clean:build", "build:all"));