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
const sfx = require("sfx");

const buildInfos = config.buildInfos;
const utils = common.utils;

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
    return common.formGlobs([
        path.join(buildInfos.paths.modulesDir, "**/*.d.ts"),
        "./.build/tasks/build.sdk/package/**/*"]);
}

/**
 * 
 * @param {string} dir 
 * @returns {Array.<string>}
 */
function getDeclarationFilePaths(dir) {
    const children = fs.readdirSync(dir);

    /** @type {Array.<string>} */
    const filePaths = [];

    for (const child of children) {
        const stat = fs.statSync(path.join(dir, child));

        if (stat.isDirectory()) {
            filePaths.push(...getDeclarationFilePaths(path.join(dir, child)));
        } else {
            filePaths.push(path.join(dir, child));
        }
    }

    return filePaths;
}

function updateTypeDeclarationFile() {
    const dTsFiles = getDeclarationFilePaths(buildInfos.paths.sdkDir);
    const sfxDts = path.join(buildInfos.paths.sdkDir, sdkPackageJson.types);

    dTsFiles.forEach(
        (fileName) =>
            fs.appendFileSync(
                sfxDts,
                utils.format("/// <reference path='{}' />\r\n", path.relative(buildInfos.paths.sdkDir, fileName).replace('\\', '/'))));
}

gulp.task("build:gather-declarations",
    () => gulp.src(getTypeDeclarationGlobs())
        .pipe(gulp.dest(buildInfos.paths.sdkDir)));

gulp.task("build:generate-sdk-packagejson",
    () => {
        sdkPackageJson.version = buildInfos.buildNumber;
        common.ensureDirExists(buildInfos.paths.sdkDir);
        fs.writeFileSync(path.join(buildInfos.paths.sdkDir, "package.json"), sdkPackageJson);
    });

gulp.task("build:update-sdk-declarations", ["build:gather-declarations"],
    () => updateTypeDeclarationFile());

gulp.task("build:sdk", ["build:update-sdk-declarations", "build:generate-sdk-packagejson"],
    () => gulp.src(path.join(buildInfos.paths.sdkDir, "**/*"))
        .pipe(gulp.dest(path.join("./node_modules", sdkPackageJson.name))));
