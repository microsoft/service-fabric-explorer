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

gulp.task("build:gather-declarations",
    () => gulp.src(getTypeDeclarationGlobs())
        .pipe(gulp.dest(buildInfos.paths.sdkDir)));

gulp.task("build:generate-sdk-packagejson",
    (done) => {
        sdkPackageJson.version = buildInfos.buildNumber;
        common.ensureDirExists(buildInfos.paths.sdkDir);
        fs.writeFileSync(path.join(buildInfos.paths.sdkDir, "package.json"), JSON.stringify(sdkPackageJson, undefined, 4));

        done();
    });

gulp.task("build:sdk", gulp.parallel("build:gather-declarations", "build:generate-sdk-packagejson"));
