//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const config = require("../config");
const utilities = require("../utilities");

const gulp = require("gulp");
const log = require("fancy-log");

const packagejson = config.packageJson;
const utils = common.utils;

const dependencyTypeToArg = {
    /**
     * @readonly
     * @type {string}
     */
    dev: "--no-save",

    /**
     * @readonly
     * @type {string}
     */
    prod: "-P"
};

/**
 * Check if the module is installed.
 * @param {string} moduleName The name of the module.
 * @returns {boolean} True if the give module is installed. Otherwise, false.
 */
function isInstalled(moduleName) {
    try {
        require.resolve(moduleName);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Log skipped depedencies.
 * @param {string} dependencyName The name of the dependency.
 * @param {string} propertyName The conditional property name.
 * @param {string} propertyValue The conditional property value.
 * @param {string} currentValue The current conditional value.
 */
function logSkipping(dependencyName, propertyName, propertyValue, currentValue) {
    log.info("Skipping publish-dependency:", dependencyName, propertyName, "=>", "required:" + propertyValue, "current:" + currentValue);
}

gulp.task("publish:prepare",
    () => {
        /** @type {Array.<Promise>} */
        const promises = [];

        for (const dependencyName in packagejson.publishDependencies) {
            if (!isInstalled(dependencyName)) {
                const dependency = packagejson.publishDependencies[dependencyName];
                let versionArg = "";
                let dependencyTypeArgs = "";

                if (utils.isString(dependency.platform) && dependency.platform !== process.platform) {
                    logSkipping(dependencyName, "Platform", dependency.platform, process.platform);
                    continue;
                }

                if (utils.isString(dependency.arch) && dependency.arch !== process.arch) {
                    logSkipping(dependencyName, "Arch", dependency.arch, process.arch);
                    continue;
                }

                if (!Array.isArray(dependency.dependencyTypes)) {
                    dependency.dependencyTypes = ["dev"];
                }

                dependency.dependencyTypes.forEach(typeName => dependencyTypeArgs += dependencyTypeToArg[typeName] + " ");

                if (dependency.version) {
                    versionArg += "@" + dependency.version;
                }

                const cmd = `npm install ${dependencyName}${versionArg} ${dependencyTypeArgs}`;

                promises.push(utilities.exec(".", cmd));
            }
        }

        return Promise.all(promises);
    });