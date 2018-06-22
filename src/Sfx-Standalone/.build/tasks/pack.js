//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const config = require("../config");

const path = require("path");
const gulp = require("gulp");
const packager = require("electron-packager");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;

/**
 * Convert Common.Architecture to architecture of electron-packager.
 * @param {string} arch The value of Common.Architecture to convert from.
 * @returns {string} The corresponding architecture of electron-packager.
 */
function toPackagerArch(arch) {
    switch (arch) {
        case Architecture.X86:
            return "ia32";

        case Architecture.X64:
            return "x64";

        default:
            throw new Error("unsupported architecture: " + arch);
    };
}
exports.toPackagerArch = toPackagerArch;

/**
 * Convert array of Common.Architecture to the array of architecture of electron-packager.
 * @param {Array.<string>} archs The array of the value of Common.Architecture to convert from.
 * @returns {Array.<string>} The array of the corresponding architecture of electron-packager.
 */
function toPackagerArchs(archs) {
    if (!Array.isArray(archs)) {
        throw "archs has to be an array.";
    }

    /** @type {Array.<string>} */
    let convertedArchs = [];

    archs.forEach((arch) => convertedArchs.push(toPackagerArch(arch)));

    return convertedArchs;
}
exports.toPackagerArchs = toPackagerArchs;

/**
 * Convert Common.Platform to platform of electron-packager.
 * @param {string} platform The value of Common.Platform to convert from.
 * @returns {string} The corresponding platform of electron-packager.
 */
function toPackagerPlatform(platform) {
    switch (platform) {
        case Platform.Linux:
            return "linux";

        case Platform.Windows:
            return "win32";

        case Platform.MacOs:
            return "darwin";

        default:
            throw "unsupported platform: " + platform;
    };
}
exports.toPackagerPlatform = toPackagerPlatform;

/**
 * Generate package for given platform.
 * @param {string} platform The target platform (Common.Platform).
 * @returns {Promise.<Array.<string>>} The promise of packaging async operation.
 */
function generatePackage(platform) {
    const packConfig = {
        dir: buildInfos.paths.appDir,
        appCopyright: buildInfos.copyright,
        arch: toPackagerArchs(buildInfos.targets[platform].archs),
        asar: false,
        icon: "icons/icon",
        name: platform === Platform.MacOs ? buildInfos.productName : buildInfos.targetExecutableName,
        out: buildInfos.paths.buildDir,
        overwrite: true,
        platform: toPackagerPlatform(platform),
        appBundleId: buildInfos.appId,
        appCategoryType: buildInfos.appCategory
    };

    return packager(packConfig);
}
exports.generatePackage = generatePackage;

require("./build");
require("./pack.licensing");

gulp.task("pack:update-version", () => common.appdirExec(common.utils.format("npm version {} --allow-same-version", buildInfos.buildNumber)));

gulp.task("pack:prepare", gulp.series("clean-build:all", gulp.parallel("pack:update-version", "pack:licensing")));

gulp.task("pack:windows", gulp.series("pack:prepare", () => generatePackage(Platform.Windows)));

gulp.task("pack:linux", gulp.series("pack:prepare", () => generatePackage(Platform.Linux)));

gulp.task("pack:macos", gulp.series("pack:prepare", () => generatePackage(Platform.MacOs)));

