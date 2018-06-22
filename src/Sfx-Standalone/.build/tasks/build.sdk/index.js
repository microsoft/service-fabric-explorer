//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../../common");
const config = require("../../config");

const gulp = require("gulp");
const path = require("path");
const fs = require("fs");

const buildInfos = config.buildInfos;

/**
 * @typedef ISdkPackageJson
 * @property {string} name
 * @property {string} version
 * @property {string} types
 */

/** @type {ISdkPackageJson} */
const sdkPackageJson = require("./package.json");

/**
 * @returns {Array.<string>} 
 */
function getTypeDeclarationGlobs() {
    return common.formGlobs(["**/*.d.ts"]);
}

gulp.task("build:sdk@prepare",
    () => Promise.resolve(common.ensureDirExists(buildInfos.paths.sdkDir)));

gulp.task("build:sdk@ts-declarations",
    () =>
        gulp.src(getTypeDeclarationGlobs())
            .pipe(gulp.dest(buildInfos.paths.sdkDir)));

gulp.task("build:sdk@packagejson",
    () => {
        sdkPackageJson.version = buildInfos.buildNumber;
        fs.writeFileSync(path.join(buildInfos.paths.sdkDir, "package.json"), JSON.stringify(sdkPackageJson, undefined, 4));

        return Promise.resolve();
    });

gulp.task("build:sdk@sfx-standalone",
    () => {
        return gulp.src(buildInfos.paths.appDir + "/**/*")
            .pipe(gulp.dest(buildInfos.paths.sdkDir + "/app"));
    });

gulp.task("build:sdk",
    gulp.series(
        "build:sdk@prepare",
        gulp.parallel(
            "build:sdk@ts-declarations",
            "build:sdk@packagejson",
            "build:sdk@sfx-standalone")));
