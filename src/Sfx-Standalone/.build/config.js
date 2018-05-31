//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const common = require("./build.common");

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

 const gutil = require("gulp-util");

/**
 * @type {IBuildInfos}
 */
export const buildInfos = require("./buildInfos.json");

// buildInfos auto-initializiation
gutil.log("Starting", "buildInfos auto-initializiation", "...");

if (buildInfos.buildNumber === "*") {
    gutil.log("Read", "BUILD_BUILDNUMBER", "=", process.env["BUILD_BUILDNUMBER"]);
    gutil.log("Read", "packagejson.version", "=", packagejson.version)
    buildInfos.buildNumber = process.env["BUILD_BUILDNUMBER"] || packagejson.version;
    gutil.log("Initialized", "buildInfos.buildNumber:", "=", buildInfos.buildNumber);
}

if (buildInfos.paths.appDir === "*") {
    buildInfos.paths.appDir = path.join(buildInfos.paths.buildDir, "app");
    gutil.log("Initialized", "buildInfos.paths.appDir", "=", buildInfos.paths.appDir);
}

if (buildInfos.paths.sfxDir === "*") {
    buildInfos.paths.sfxDir = path.join(buildInfos.paths.appDir, "sfx");
    gutil.log("Initialized", "buildInfos.paths.sfxDir", "=", buildInfos.paths.sfxDir);
}

gutil.log("Finished", "buildInfos auto-initializiation", ".");

/**
 * @typedef ITypeScriptConfig
 * @property {Array.<string>} include
 * @property {Array.<string>} exclude
 * @property {*} compilerOptions
 */

/** @type {ITypeScriptConfig} */
export const tsConfig = require("../tsconfig.json");

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
export const packageJson = require("../package.json");