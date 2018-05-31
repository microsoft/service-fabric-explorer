//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const config = require("../config");
const tsc = require("../tsc");

const ts = require("typescript");
const gulp = require("gulp");
const gtslint = require("gulp-tslint");
const tslint = require("tslint");
const runSequence = require("run-sequence");

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
        tsconfig.include.forEach((pattern) => globs.push("../" + pattern));
    } else if (!isNullOrUndefined(tsconfig.include)) {
        throw new Error("tsconfig.include must be an array!");
    }

    // Exclude
    if (Array.isArray(tsconfig.exclude)) {
        tsconfig.exclude.forEach((pattern) => globs.push("!../" + pattern));
    } else if (!isNullOrUndefined(tsconfig.include)) {
        throw new Error("tsconfig.exclude must be an array!");
    }

    return formGlobs(globs);
}

require("./clean");

gulp.task("build:tslint",
    () => gulp.src(getTypescriptsGlobs())
        .pipe(gtslint({ program: tslint.Linter.createProgram("../tsconfig.json") }))
        .pipe(gtslint.report({ summarizeFailureOutput: true })));

gulp.task("build:ts", ["build:tslint"],
    () => {
        const tsconfig = config.tsConfig;
        const compilterOptionsParseResult = ts.convertCompilerOptionsFromJson(tsconfig.compilerOptions, undefined);

        if (Array.isArray(compilterOptionsParseResult.errors) && compilterOptionsParseResult.errors.length > 0) {
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
    });

gulp.task("build:html",
    () => gulp.src(common.formGlobs("../**/*.html"))
        .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:img",
    () => gulp.src(common.formGlobs(["../icons/**/*.*"]))
        .pipe(gulp.dest(path.join(buildInfos.paths.appDir, "icons"))));

gulp.task("build:json",
    () => gulp.src(common.formGlobs(["../**/*.json"]))
        .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:node_modules", ["build:json"],
    () => common.appdirExec("npm install --production"));

gulp.task("build:sfx",
    () => gulp.src(["../../Sfx/wwwroot/**/*.*"])
        .pipe(gulp.dest(buildInfos.paths.sfxDir)));

gulp.task("build:licenses",
    () => gulp.src(common.formGlobs(["../LICENSE"]))
        .pipe(gulp.dest(buildInfos.paths.appDir)));

gulp.task("build:all", ["build:sfx", "build:ts", "build:html", "build:node_modules", "build:json", "build:img", "build:licenses"]);

gulp.task("build", ["build:all"]);
gulp.task("clean-build", (callback) => runSequence("clean:build", "build", callback));
