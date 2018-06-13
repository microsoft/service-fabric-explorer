//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const pack = require("./pack");
const config = require("../config");
const versioning = require("../versioning");

const path = require("path");
const gulp = require("gulp");
const log = require("fancy-log");
const runSequence = require("run-sequence");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;
const utils = common.utils;

/**
 * Generate the name of the zip file for given architecture.
 * @param {string} arch common.Architecture
 * @returns {string} The name of the zip file.
 */
function getZipName(arch) {
    return utils.format("{}-{}-{}.zip", buildInfos.targetExecutableName, buildInfos.buildNumber, arch);
}

gulp.task("publish:versioninfo-macos",
    () => versioning.generateVersionInfo(
        Platform.MacOs,
        (baseUrl, arch) => utils.format("{}/{}", baseUrl, getZipName(arch))));

gulp.task("publish:zip-macos-x64", ["publish:prepare"],
    (callback) => {
        if (buildInfos.targets[Platform.MacOs].archs.indexOf(Architecture.X64) < 0) {
            log.info("Skipping", "zip-macos-64:", "No x64 architecture specified in buildinfos.");
            callback();
            return;
        }

        const macZipper = require('electron-installer-zip');
        const packDirName = utils.format("{}-{}-{}", buildInfos.productName, pack.toPackagerPlatform(Platform.MacOs), pack.toPackagerArch(Architecture.X64));
        const appDirName = utils.format("{}.app", buildInfos.productName);

        macZipper(
            {
                dir: path.resolve(path.join(buildInfos.paths.buildDir, packDirName, appDirName)),
                out: path.resolve(path.join(buildInfos.paths.publishDir, Platform.MacOs, getZipName(pack.toPackagerArch(Architecture.X64))))
            },
            (err, res) => callback(err))
    });

gulp.task("publish:macos",
    (callback) => runSequence(
        "pack:macos",
        ["publish:versioninfo-macos", "publish:zip-macos-x64"],
        callback));