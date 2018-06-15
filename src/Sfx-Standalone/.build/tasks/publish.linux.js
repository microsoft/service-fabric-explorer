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
const runSequence = require("run-sequence");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;

/**
 * Convert common.Architecture to installer.arch.
 * @param {string} arch common.Architecture to be convert from.
 * @returns {string} The corresponding installer.arch.
 */
function toInstallerArch(arch) {
    switch (arch) {
        case Architecture.X86:
            return "i386";

        case Architecture.X64:
            return "amd64";

        default:
            throw `unsupported architecture: ${arch}`;
    };
}

/**
 * Generate installer options by given architecture.
 * @param {string} arch common.Architecture.
 * @returns {}
 */
function getInstallerOptions(arch) {
    const packDirName = `${buildInfos.targetExecutableName}-${pack.toPackagerPlatform(Platform.Linux)}-${pack.toPackagerArch(arch)}`;
    const packDirPath = path.resolve(path.join(buildInfos.paths.buildDir, packDirName));

    return {
        src: packDirPath,
        dest: path.join(buildInfos.paths.publishDir, Platform.Linux),
        arch: toInstallerArch(arch),
        name: buildInfos.targetExecutableName,
        productName: buildInfos.productName,
        genericName: buildInfos.productName,
        version: buildInfos.buildNumber,
        revision: "0",
        section: "utils",
        bin: buildInfos.targetExecutableName,
        icon: {
            "16x16": "icons/icon16x16.png",
            "32x32": "icons/icon32x32.png",
            "48x48": "icons/icon48x48.png",
            "52x52": "icons/icon52x52.png",
            "64x64": "icons/icon64x64.png",
            "96x96": "icons/icon96x96.png",
            "128x128": "icons/icon128x128.png",
            "192x192": "icons/icon192x192.png",
            "256x256": "icons/icon256x256.png",
            "512x512": "icons/icon512x512.png",
            "1024x1024": "icons/icon1024x1024.png"
        },
        categories: ["Utility", "Development"]
    };
}

/**
 * Generate deb packages by given architecture.
 * @param {string} arch common.Architecture.
 * @returns {Promise}
 */
function publishDeb(arch) {
    const debBuilder = require("electron-installer-linux").debian;

    return debBuilder(getInstallerOptions(arch));
}

/**
 * Generate rpm packages by given architecture.
 * @param {string} arch common.Architecture.
 * @returns {Promise}
 */
function publishRpm(arch) {
    const rpmBuilder = require("electron-installer-linux").redhat;

    return rpmBuilder(getInstallerOptions(arch));
}

gulp.task("publish:versioninfo-linux",
    () => versioning.generateVersionInfo(
        Platform.Linux,
        (baseUrl, arch) => `https://github.com/Microsoft/service-fabric-explorer/releases/tag/v${buildInfos.buildNumber}`));

gulp.task("publish:linux-deb-x86", ["publish:prepare"],
    () => publishDeb(Architecture.X86));

gulp.task("publish:linux-deb-x64", ["publish:prepare"],
    () => publishDeb(Architecture.X64));

gulp.task("publish:linux-rpm-x86", ["publish:prepare"],
    () => publishRpm(Architecture.X86));

gulp.task("publish:linux-rpm-x64", ["publish:prepare"],
    () => publishRpm(Architecture.X64));

gulp.task("publish:linux-deb", ["publish:linux-deb-x86", "publish:linux-deb-x64"]);

gulp.task("publish:linux-rpm",
    (callback) =>
        runSequence(
            "publish:linux-rpm-x86",
            "publish:linux-rpm-x64",
            callback));

gulp.task("publish:linux",
    (callback) => runSequence(
        "pack:linux",
        [
            "publish:versioninfo-linux",

            "publish:linux-deb",
            "publish:linux-rpm",
        ],
        callback));
