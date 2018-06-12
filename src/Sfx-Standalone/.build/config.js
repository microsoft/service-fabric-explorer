//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const path = require("path");

/**
 * @typedef ISfxDependency
 * @property {string} version
 * @property {Array.<'dev'|'prod'>} dependencyTypes
 * @property {string} platform
 */

/**
  * @typedef IPackageJson
  * @property {string} name
  * @property {string} version
  * @property {string} homepage
  * @property {string} [license]
  * @property {Array.<string>} [devDependencies]
  * @property {Array.<string>} [dependencies]
  * @property {Array.<string>} [optionalDependencies]
  * @property {Array.<string>} [peerDependencies]
  * @property {Array.<string>} [bundleDependencies]
  * @property {Array.<string>} [extensionDependencies]
  * @property {Array.<ISfxDependency>} [sfxDependencies]
  */

/** @type {IPackageJson} */
const packageJson = require("../package.json");
exports.packageJson = packageJson;

/**
 * @typedef IBuildTarget
 * @property {Array.<'x86'|'x64'>} archs - Array of Architecture
 */

/**
 * @typedef IBuildTargets
 * @property {IBuildTarget} [windows]
 * @property {IBuildTarget} [macos]
 * @property {IBuildTarget} [linux]
 */

/**
 * @typedef IBuildPaths
 * @property {string} buildDir
 * @property {string} publishDir
 * @property {string} appDir
 * @property {string} sfxDir
 * @property {string} modulesDir
 * @property {string} sdkDir
 */

/**
 * @typedef IBuildLicensing
 * @property {string} apis.usages.url
 * @property {string} apis.usages.method
 * @property {string} group
 * @property {string} project
 * @property {string} thirdPartyNoticesFileName;
 * @property {Object.<string, string>} packageLicenses
 */

/**
 * @typedef IUpdateInfos
 * @property {string} baseUrl
 * @property {Object.<string, IPackageInfo | string>} packageInfos;
 */

/**
 * @typedef IBuildInfos
 * @property {string} productName
 * @property {string} description
 * @property {string} copyright
 * @property {string} targetExecutableName
 * @property {string} appId
 * @property {string} appCategory
 * @property {string} buildNumber
 * @property {IUpdateInfos} updateInfos
 * @property {IBuildTargets} targets
 * @property {IBuildPaths} paths
 * @property {IBuildLicensing} licensing
 */

 const log = require("fancy-log");

/**
 * @type {IBuildInfos}
 */
const buildInfos = require("./buildInfos.json");
exports.buildInfos = buildInfos;

// buildInfos auto-initializiation
log.info("Starting", "buildInfos auto-initializiation", "...");

if (buildInfos.buildNumber === "*") {
    log.info("Read", "BUILD_BUILDNUMBER", "=", process.env["BUILD_BUILDNUMBER"]);
    log.info("Read", "packageJson.version", "=", packageJson.version)
    buildInfos.buildNumber = process.env["BUILD_BUILDNUMBER"] || packageJson.version;
    log.info("Initialized", "buildInfos.buildNumber:", "=", buildInfos.buildNumber);
}

if (buildInfos.paths.appDir === "*") {
    buildInfos.paths.appDir = path.join(buildInfos.paths.buildDir, "app");
    log.info("Initialized", "buildInfos.paths.appDir", "=", buildInfos.paths.appDir);
}

if (buildInfos.paths.sfxDir === "*") {
    buildInfos.paths.sfxDir = path.join(buildInfos.paths.appDir, "sfx");
    log.info("Initialized", "buildInfos.paths.sfxDir", "=", buildInfos.paths.sfxDir);
}

if (buildInfos.paths.sdkDir === "*") {
    buildInfos.paths.sdkDir = path.join(buildInfos.paths.buildDir, "sdk");
    log.info("Initialized", "buildInfos.paths.sdkDir", "=", buildInfos.paths.sdkDir);
}

log.info("Finished", "buildInfos auto-initializiation", ".");

/**
 * @typedef ITypeScriptConfig
 * @property {Array.<string>} include
 * @property {Array.<string>} exclude
 * @property {*} compilerOptions
 */

/** @type {ITypeScriptConfig} */
exports.tsConfig = require("../tsconfig.json");
