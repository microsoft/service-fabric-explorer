//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const config = require("../config");

const fs = require("fs");
const path = require("path");
const gulp = require("gulp");
const log = require("fancy-log");

const utils = common.utils;
const buildInfos = config.buildInfos;

/**
 * @typedef {() => string} getLicenseText
 * @returns {string}
 */

/**
 * @typedef ILicense
 * @property {string} spdxId
 * @property {getLicenseText} getLicenseText
 */

/**
 * @typedef DepType
 * @type {'dev'|'prod'}
 */

/**
 * @typedef ILicensingDependency
 * @property {string} name
 * @property {string} version
 * @property {string} homepage
 * @property {ILicense} license
 * @property {DepType} [depType]
 */

/**
 * @type {ILicense}
 */
class License {
    /**
     * 
     * @param {string} spdxId 
     */
    constructor(spdxId) {
        if (utils.string.isNullUndefinedOrWhitespaces(spdxId)) {
            throw new Error("spdxId should not be null/undefined/empty.");
        }

        this.spdxId = spdxId;
    }
}

/**
 * @type {ILicense}
 */
class FileLicense extends License {
    /**
     * 
     * @param {string} spdxId 
     * @param {string} licensePath 
     */
    constructor(spdxId, licensePath) {
        super(spdxId);

        if (utils.isNullOrUndefined(licensePath) || !fs.existsSync(licensePath)) {
            throw Error("licensePath should not be null/undefined and the pointing file should exist.");
        }

        this.licensePath = licensePath;
    }

    getLicenseText() {
        return fs.readFileSync(this.licensePath, { encoding: "utf8" });
    }
}

/**
 * @type {ILicense}
 */
class ReadmeLicense extends FileLicense {
    getLicenseText() {
        const readmeText = super.getLicenseText();
        const licenseIdentifier = "## License";

        let licenseIndex = readmeText.indexOf(licenseIdentifier);

        if (licenseIndex < 0) {
            return null;
        } else {
            licenseIndex += licenseIdentifier.length;
        }

        const licenseEndIndex = readmeText.indexOf("#", licenseIndex);
        const nonCharRegex = /\w/g;

        for (let index = licenseIndex; index < readmeText.length; index++) {
            if (nonCharRegex.test(readmeText[index])) {
                licenseIndex = index;
                break;
            }
        }

        return readmeText.substring(licenseIndex, licenseEndIndex < 0 ? undefined : licenseEndIndex);
    }
}

/**
 * Get the name of license of given dep.
 * @param {IPackageJson} dep The package.json of the given dependency.
 * @returns {string} The value of license property in package.json of the given dep.
 */
function getLicense(dep) {
    if (utils.isString(dep.license)) {
        return dep.license;
    }

    const license = buildInfos.licensing.packageLicenses[dep.name];

    if (!utils.isString(license)) {
        throw new Error("Cannot determine the license of dep: " + dep.name);
    }

    return license;
}

/**
 * Generate licensing dependency (ILicensingDependency) for the given dependency.
 * @param {string} depName The name of dependency.
 * @param {string} depsDir The directory containing the given depdency.
 * @param {string} packageJsonName The name of the package config file.
 * @returns {ILicensingDependency} The licensing dependency object.
 */
function generateDep(depName, depsDir, packageJsonName) {
    const licenseFileNamePattern = /.*LICENSE.*/gi;
    const readmeFileNamePattern = /README.md/gi;

    /** @type {string} */
    const depDir = path.resolve(path.join(depsDir, depName));

    if (!fs.existsSync(depDir)) {
        throw new Error(utils.format('Cannot find dependency "{}".'));
    }

    /** @type {IPackageJson} */
    const depJson = require(path.join(depDir, packageJsonName));

    /** @type {ILicense} */
    let depLicense = null;

    /** @type {string} */
    let readmeFileName = null;

    for (const fileName of fs.readdirSync(depDir)) {
        if (licenseFileNamePattern.test(fileName)) {
            depLicense = new FileLicense(getLicense(depJson), path.join(depDir, fileName));
            break;
        }

        if (readmeFileNamePattern.test(fileName)) {
            readmeFileName = fileName;
        }
    }

    if (depLicense === null && fs.existsSync(path.join(depDir, readmeFileName))) {
        depLicense = new ReadmeLicense(getLicense(depJson), path.join(depDir, readmeFileName));
    }

    if (utils.isNullOrUndefined(depLicense)) {
        throw new Error(utils.format('Cannot find license file for dependency, "{}".', depName));
    }

    return {
        name: depJson.name,
        version: depJson.version,
        homepage: depJson.homepage,
        license: depLicense
    };
}

/**
 * Generate licensing dependencies (ILicensingDependency).
 * @param {DepType} depType The target dependency type.
 * @param {'npm'|'bower'} packageFormat The package format, bower or npm. 
 * @param {string} depsDir The directory containing dependencies.
 * @param {Object.<string,string>|Array.<string>} deps The dependency key value pair.
 * @returns {Array.<ILicensingDependency>} The generated licensing dependencies.
 */
function generateLicensingDeps(depType, packageFormat, depsDir, deps) {
    if (utils.isNullOrUndefined(deps)) {
        return [];
    }

    if (!fs.existsSync(depsDir)) {
        throw new Error(String.format('depsDir "{}" does not exist.', depsDir));
    }

    /** @type {Array.<string>} */
    let depNames;

    if (Array.isArray(deps)) {
        depNames = deps;
    } else if (utils.isObject(deps)) {
        depNames = Object.keys(deps);
    } else {
        throw new Error("unknow type of deps: " + typeof deps);
    }

    /** @type {Array.<ILicensingDependency>} */
    let licensingDeps = [];

    /** @type {string} */
    let packageJsonName;

    switch (packageFormat) {
        case "bower":
            packageJsonName = ".bower.json";
            break;

        case "npm":
        default:
            packageJsonName = "package.json";
            break;
    }

    /** @type {boolean} */
    let hasErrors = false;

    depNames.forEach((depName) => {
        try {
            const dep = generateDep(depName, depsDir, packageJsonName);

            dep.depType = depType;
            licensingDeps.push(dep);
        } catch (error) {
            log.info("Failed to generate licensing dep for package:", depName, "Error:", error);
            hasErrors = true;
        }
    });

    if (hasErrors) {
        throw new Error("There are errors when resolving licensing dependencies.");
    }

    return licensingDeps;
}

/**
 * Generate the thrid party notice text file in the given path.
 * @param {Array.<ILicensingDependency>} deps The dependencies to include in the third party notice.
 * @param {string} noticeFilePath The third party notice file path.
 */
function generateThirdPartyNotice(deps, noticeFilePath) {
    if (!Array.isArray(deps)) {
        throw new Error("deps must be a valid array of ILicensingDependency.");
    }

    if (!utils.isString(noticeFilePath)) {
        throw new Error("noticeFilePath must be a valid string.");
    }

    noticeFilePath = path.resolve(noticeFilePath);

    if (fs.existsSync(noticeFilePath)) {
        fs.unlinkSync(noticeFilePath);
    }

    /** @type {number} */
    const noticeFd = fs.openSync(path.join(buildInfos.paths.appDir, buildInfos.licensing.thirdPartyNoticesFileName), "w");

    try {
        log.info("Generating third party notices files:", buildInfos.licensing.thirdPartyNoticesFileName, "...");
        fs.appendFileSync(noticeFd, "THIRD-PARTY SOFTWARE NOTICES AND INFORMATION\r\n");
        fs.appendFileSync(noticeFd, "Do Not Translate or Localize\r\n");
        fs.appendFileSync(noticeFd, "\r\n");
        fs.appendFileSync(noticeFd, "This project incorporates components from the projects listed below. The original copyright notices and the licenses under which Microsoft received such components are set forth below. Microsoft reserves all rights not expressly granted herein, whether by implication, estoppel or otherwise.\r\n");
        fs.appendFileSync(noticeFd, "\r\n");

        // Remove the duplications        
        let dependencyMap = new Map();        
        deps.forEach(dep => {
            dependencyMap.set(dep.name, dep);            
        });

        let depIndex = 1;
        dependencyMap.forEach(dep => {            
            fs.appendFileSync(noticeFd, utils.format("{}.\t{} ({})\r\n", depIndex, dep.name, dep.homepage));
            depIndex = depIndex + 1;
        });

        dependencyMap.forEach(dep => {            
            fs.appendFileSync(noticeFd, "\r\n");
            fs.appendFileSync(noticeFd, utils.format("{} NOTICES AND INFORMATION BEGIN HERE\r\n", dep.name));
            fs.appendFileSync(noticeFd, "=========================================\r\n");
            fs.appendFileSync(noticeFd, dep.license.getLicenseText() || utils.format("{} License: {}", dep.license.spdxId, dep.homepage));
            fs.appendFileSync(noticeFd, "\r\n");
            fs.appendFileSync(noticeFd, "=========================================\r\n");
            fs.appendFileSync(noticeFd, utils.format("END OF {} NOTICES AND INFORMATION\r\n", dep.name));
        });
    }
    catch (e) {
        log.error("Generating third party notices files failed.", e);
    } finally {
        fs.closeSync(noticeFd);
        log.info("Finished generation of the third party notices files:", buildInfos.licensing.thirdPartyNoticesFileName, ".");
    }
}

gulp.task("pack:licensing",
    () => {
        const packagejson = config.packageJson;

        /** @type {Array.<ILicensingDependency>} */
        let msInternalDeps = [];

        /** @type {Array.<ILicensingDependency>} */
        let prodDeps = [];

        prodDeps = prodDeps.concat(generateLicensingDeps("prod", "npm", path.join(buildInfos.paths.appDir, "node_modules"), packagejson.dependencies));
        prodDeps = prodDeps.concat(generateLicensingDeps("prod", "npm", path.join(buildInfos.paths.appDir, "node_modules"), packagejson.optionalDependencies));

        if (fs.existsSync("../Sfx/package.json")) {
            /** @type {IPackageJson} */
            const sfxPackageJson = require("../../../Sfx/package.json");

            prodDeps = prodDeps.concat(generateLicensingDeps("prod", "npm", "../Sfx/node_modules", sfxPackageJson.dependencies));
            prodDeps = prodDeps.concat(generateLicensingDeps("prod", "npm", "../Sfx/node_modules", sfxPackageJson.optionalDependencies));
        }

        if (fs.existsSync("../Sfx/bower_components")) {
            prodDeps = prodDeps.concat(generateLicensingDeps("prod", "bower", "../Sfx/bower_components", fs.readdirSync("../Sfx/bower_components", { encoding: "utf8" })));
        }

        msInternalDeps = msInternalDeps.concat(generateLicensingDeps("dev", "npm", "./node_modules", packagejson.devDependencies));

        generateThirdPartyNotice(prodDeps, path.join(buildInfos.paths.appDir, buildInfos.licensing.thirdPartyNoticesFileName));
    });
