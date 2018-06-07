//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const config = require("./config");

const gutil = require("gulp-util");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const pify = require("pify");

const pified_exec = pify(child_process.exec, { multiArgs: true });
const buildInfos = config.buildInfos;

/**
 * @readonly
 */
const utils = {
    /**
     * Check if value is number or not.
     * @param {()} value 
     * @returns {boolean} True if value is number. Otherwise, false.
     */
    isNumber: (value) => typeof value === "number" || value instanceof Number,

    /**
      * Check if value is function or not.
      * @param {*} value 
      * @returns {boolean} True if value is function. Otherwise, false.
      */
    isFunction: (value) => typeof value === "function",

    /**
     * Check if value is object or not.
     * @param {*} value
     * @returns {boolean} True if value is object. Otherwise, false. 
     */
    isObject: (value) => value !== null && typeof value === "object",

    /**
     * Check if value is string or not.
     * @param {*} value 
     * @returns {boolean} True if value is string. Otherwise, false.
     */
    isString: (value) => typeof value === "string" || value instanceof String,

    /**
    * Check if value is null or undefined.
    * @param {*} value 
    * @returns {boolean} True if value is null or undefined. Otherwise, false.
    */
    isNullOrUndefined: (value) => value === undefined || value === null,

    /**
     * Replaces the format item in a specified string with the string representation of a corresponding object in a specified array.
     * Uses "{}" or "{<index>}" as placeholders.
     * @readonly
     * @param {string} format A composite format string.
     * @param {...*} args An object array that contains zero or more objects to format.
     * @returns {string} A copy of format in which the format items have been replaced by the string representation of the corresponding objects in args
     */
    format: (format, ...args) => {
        if (!utils.isString(format)) {
            throw new Error("format must be a string");
        }

        if (!Array.isArray(args)) {
            throw new Error("args must be an array.");
        }

        if (args === null || args === undefined) {
            return format;
        }

        let matchIndex = -1;

        return format.replace(/(\{*)(\{(\d*)\})/gi,
            (substring, escapeChar, argIdentifier, argIndexStr) => {
                matchIndex++;

                if (escapeChar.length > 0) {
                    return argIdentifier;
                }

                let argIndex = argIndexStr.length === 0 ? matchIndex : parseInt(argIndexStr, 10);

                if (isNaN(argIndex) || argIndex < 0 || argIndex >= args.length) {
                    throw new Error(String.format("Referenced arg index, '{}',is out of range of the args.", argIndexStr));
                }

                return args[argIndex];
            });
    },

    /**
     * Utils for array.
     * @readonly
     */
    array: {

        /**
         * Check if the given array, value, is null/undefined/empty array (no element in the array).
         * @readonly
         * @param {*} value The given array to check.
         * @returns {boolean} True if the array, value, is null/undefined/empty array. Otherwise, false.
         */
        isNullUndefinedOrEmpty: (value) => value === undefined || value === null || (Array.isArray(value) && value.length <= 0)
    },

    /**
    * Utils for string.
    * @readonly
    */
    string: {
        /**
         * Check if the given string, value, is null/undefined/empty string.
         * @readonly
         * @param {*} value The given string to check.
         * @returns {boolean} True if the given string, value, is null/undefined/empty string. Otherwise, false.
         */
        isNullUndefinedOrEmpty: (value) => value === undefined || value === null || (String.isString(value) && value === ""),

        /**
         * Check if the given string, value, is null/undefined/empty string/whitespaces.
         * @readonly
         * @param {*} value The given string to check.
         * @returns {boolean} True if the given string, value, is null/undefined/empty string. Otherwise, false.
         */
        isNullUndefinedOrWhitespaces: (value) => value === undefined || value === null || (String.isString(value) && value.trim() === "")
    }
};

exports.utils = utils;

/**
 * @readonly
 * @enum {string}
 */
exports.Architecture = {
    X86: "x86",
    X64: "x64"
};

/**
 * @readonly
 * @enum {string}
 */
exports.Platform = {
    Windows: "windows",
    Linux: "linux",
    MacOs: "macos"
};

/**
 * Log everything of the output of the command line.
 * @param {string} cmd - The command line to run.
 * @param {*} pifyResults - The pify results.
 */
function logExec(cmd, pifyResults) {
    const [error, stdout, stderr] = pifyResults;

    gutil.log("Executed:", cmd);

    if (utils.isString(stdout) && stdout.trim() !== "") {
        gutil.log(stdout);
    }

    if (utils.isString(stderr) && stderr.trim() !== "") {
        gutil.log(stderr);
    }
}

exports.logExec = logExec;

/**
 * Execute the command line in a promised way.
 * @param {string} cwd 
 * @param {string} cmd 
 * @returns {*} pifiedResults
 */
function exec(cwd, cmd) {
    return pified_exec(cmd, { cwd: cwd })
        .then((pifyResults) => logExec(cmd, pifyResults));
}

exports.exec = exec;

/**
 * Run a command line under appDir directory.
 * @param {string} cmd - the command line to run.
 */
exports.appdirExec = (cmd) => exec(path.resolve(buildInfos.paths.appDir), cmd);

/**
 * Resolve glob pattern and make it relative to basePath.
 * @param {string} pattern 
 * @param {string} basePath 
 * @returns {string} resolved glob pattern.
 */
function normalizeGlob(pattern, basePath) {
    let finalPattern = pattern;

    if (pattern[0] === "!") {
        finalPattern = pattern.slice(1);
    }

    finalPattern = path.relative(basePath, path.resolve(finalPattern));

    if (pattern[0] === "!") {
        finalPattern = "!" + finalPattern;
    }

    return finalPattern;
}

exports.normalizeGlob = normalizeGlob;

/**
 * Generate globs for given glob patterns.
 * @param {string|Array.<string>} [globs] The glob patterns.
 * @returns {Array.<string>} The generated globs.
 */
exports.formGlobs =
    (globs) => {
        /** @type {Array.<string>} */
        const outputGlobs = [];
        const basePath = path.resolve(".");

        /** @type {Array.<string>} */
        const patterns = [
            utils.format("!{}/**/*", buildInfos.paths.publishDir),
            utils.format("!{}/**/*", buildInfos.paths.buildDir),
            utils.format("!{}/**/*", "node_modules"),
            "!**/tsconfig.json",
            "!**/jsconfig.json",
            "!**/tslint.json",
            "!./.build/buildInfos.json",
            "!**/*.md"
        ];

        if (utils.isString(globs)) {
            outputGlobs.push(normalizeGlob(globs, basePath));
        }
        else if (Array.isArray(globs)) {
            globs.forEach((glob) => outputGlobs.push(normalizeGlob(glob, basePath)));
        }
        else if (!isNullOrUndefined(globs)) {
            throw "Unsupported globs: " + typeof globs;
        }

        patterns.forEach((pattern) => outputGlobs.push(normalizeGlob(pattern, basePath)));

        return outputGlobs;
    }

/**
 * Ensure the directory name exists by creating the directories.
 * @param {string} dirname The full name of the directories.
 */
exports.ensureDirExists =
    (dirname) => {
        dirname = path.resolve(dirname);

        /** @type {Array.<string>} */
        let dirs = [];

        while (!fs.existsSync(dirname)) {
            dirs.push(dirname);
            dirname = path.dirname(dirname);
        }

        while (dirs.length > 0) {
            fs.mkdirSync(dirs.pop());
        }
    }
