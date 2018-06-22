//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("./common");
const config = require("./config");

const semver = require("semver");
const path = require("path");
const fs = require("fs");

const utils = common.utils;
const buildInfos = config.buildInfos;

/**
 * @typedef IVersionInfo
 * @property {string} version
 * @property {string} [description]
 * @property {string | IPackageInfo} [linux]
 * @property {string | IPackageInfo} [windows]
 * @property {string | IPackageInfo} [macos]
 */

/**
 * Generate version.json.
 * @param {string} platform 
 * @param {getPackageInfo} getPackageInfo
 */
function generateVersionInfo(platform, getPackageInfo) {
    if (!utils.isFunction(getPackageInfo)) {
        throw new Error("getPackageInfo must be supplied.");
    }

    if (!utils.isObject(buildInfos.updateInfos) || !utils.isString(buildInfos.updateInfos.baseUrl)) {
        throw new Error("buildInfos.updateInfos.baseUrl must be specified.");
    }

    /** @type {string} */
    let channel = "public";

    const prerelease = semver.prerelease(buildInfos.buildNumber);

    if (Array.isArray(prerelease) && prerelease.length > 0) {
        channel = prerelease[0];
    }

    /** @type {IVersionInfo} */
    const versionInfo = {
        version: buildInfos.buildNumber
    };

    const baseUrl = utils.format("{}/{}/{}", buildInfos.updateInfos.baseUrl, channel, platform);
    let buildPackageInfo = null;

    if (utils.isObject(buildInfos.updateInfos.packageInfos)) {
        buildPackageInfo = buildInfos.updateInfos.packageInfos[platform];
    } else if (!utils.isNullOrUndefined(buildInfos.updateInfos.packageInfos)) {
        throw new Error("Invalid value for parameter: buildInfos.updateInfos.packageInfos");
    }

    if (utils.isString(buildPackageInfo)) {
        versionInfo[platform] = buildPackageInfo;
    } else if (utils.isNullOrUndefined(buildPackageInfo) || utils.isObject(buildPackageInfo)) {
        versionInfo[platform] = {};

        for (const arch of buildInfos.targets[platform].archs) {
            if (utils.isNullOrUndefined(buildPackageInfo) || utils.isNullOrUndefined(buildPackageInfo[arch])) {
                versionInfo[platform][arch] = getPackageInfo(baseUrl, arch);
            } else if (utils.isString(buildPackageInfo[arch])) {
                versionInfo[platform][arch] = utils.format(buildPackageInfo[arch], baseUrl, buildInfos.buildNumber, arch);
            } else {
                throw new Error(utils.format("Invalid value for parameter: buildInfos.updateInfos.packageInfos.{}.{}", platform, arch));
            }
        }
    } else {
        throw new Error(utils.format("Invalid value for parameter: buildInfos.updateInfos.packageInfos.{}", platform));
    }

    const versionInfoPath = path.resolve(path.join(buildInfos.paths.publishDir, utils.format("version.{}.json", platform)));

    common.ensureDirExists(path.dirname(versionInfoPath));
    fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, '\t'));
}

exports.generateVersionInfo = generateVersionInfo;

/**
 * @typedef {(baseUrl:string, arch:string) => string} getPackageInfo
 * @param {string} baseUrl 
 * @param {string} arch
 * @returns {string}
 */
