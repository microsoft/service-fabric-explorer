//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const pack = require("./pack");
const config = require("../config");
const versioning = require("../versioning");

const gulp = require("gulp");
const runSequence = require("run-sequence");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;
const utils = common.utils;

/**
 * Convert common.Architecture to deb.arch.
 * @param {string} arch common.Architecture to be convert from.
 * @returns {string} The corresponding deb.arch.
 */
function toDebArch(arch) {
    switch (arch) {
        case Architecture.X86:
            return "i386";

        case Architecture.X64:
            return "amd64";

        default:
            throw "unsupported architecture: " + arch;
    };
}

/**
 * Generate deb options by given architecture.
 * @param {string} arch common.Architecture.
 * @returns {}
 */
function getDebOptions(arch) {
    const packDirName = String.format("{}-{}-{}", buildInfos.targetExecutableName, pack.toPackagerPlatform(Platform.Linux), pack.toPackagerArch(arch));
    const packDirPath = path.resolve(path.join(buildInfos.paths.buildDir, packDirName));

    return {
        src: packDirPath,
        dest: path.join(buildInfos.paths.publishDir, Platform.Linux),
        arch: toDebArch(arch),
        name: buildInfos.targetExecutableName,
        productName: buildInfos.productName,
        genericName: buildInfos.productName,
        version: buildInfos.buildNumber,
        revision: "0",
        section: "utils",
        bin: buildInfos.targetExecutableName,
        icon: {
            '16x16': 'icons/icon16x16.png',
            '32x32': 'icons/icon32x32.png',
            '48x48': 'icons/icon48x48.png',
            '52x52': 'icons/icon52x52.png',
            '64x64': 'icons/icon64x64.png',
            '96x96': 'icons/icon96x96.png',
            '128x128': 'icons/icon128x128.png',
            '192x192': 'icons/icon192x192.png',
            '256x256': 'icons/icon256x256.png',
            '512x512': 'icons/icon512x512.png',
            '1024x1024': 'icons/icon1024x1024.png'
        },
        categories: ["Utility", "Development"]
    };
}

gulp.task("publish:versioninfo-linux", ["pack:linux"],
    () => versioning.generateVersionInfo(
        Platform.Linux,
        (baseUrl, arch) => utils.format("{}/{}_{}_{}.deb", baseUrl, buildInfos.targetExecutableName, buildInfos.buildNumber, toDebArch(arch))));

gulp.task("publish:deb-x86", ["pack:linux"],
    (callback) => {
        const debBuilder = require('electron-installer-debian');
        const debOptions = getDebOptions(Architecture.X86);

        debBuilder(debOptions, callback);
    });

gulp.task("publish:deb-x64", ["pack:linux"],
    (callback) => {
        const debBuilder = require('electron-installer-debian');
        const debOptions = getDebOptions(Architecture.X64);

        debBuilder(debOptions, callback);
    });

gulp.task("publish:linux",
    (callback) => runSequence(
        "clean:publish",
        ["publish:versioninfo-linux", "publish:deb-x86", "publish:deb-x64"],
        callback));
