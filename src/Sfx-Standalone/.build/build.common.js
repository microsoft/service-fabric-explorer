//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const gutil = require("gulp-util");
const path = require("path");
const child_process = require("child_process");

const pified_exec = pify(child_process.exec, { multiArgs: true });

/**
 * @readonly
 */
const utils = {
    /**
     * 
     * @readonly
     * @param {*} value
     * @returns {boolean}
     */
    isNumber: (value) => typeof value === "number" || value instanceof Number,

    /**
     * 
     * @readonly
     * @param {*} value
     * @returns {boolean}
     */
    isFunction: (value) => typeof value === "function",

    /**
     * 
     * @readonly
     * @param {*} value 
     * @returns {boolean}
     */
    isObject: (value) => value !== null && typeof value === "object",

    /**
     * @readonly
     */
    Array: {

    }
}

/**
 * Check if the given array is null/undefined/empty array.
 * @param {*} value 
 * @returns {boolean}
 */
export function isArrayNullUndefinedOrEmpty(value) {
    return value === undefined || value === null || (Array.isArray(value) && value.length <= 0);
};

/**
 * 
 * @param {*} value 
 * @returns {boolean}
 */
String.isString = (value) => {
    return typeof value === "string" || value instanceof String;
};

/**
 * 
 * @param {*} value 
 * @returns {boolean}
 */
function isStringNullUndefinedOrEmpty(value) {
    return value === undefined || value === null || (String.isString(value) && value === "");
};

/**
 * 
 * @param {*} value 
 * @returns {boolean}
 */
isStringNullUndefinedOrWhitespace = (value) => {
    return value === undefined || value === null || (String.isString(value) && value.trim() === "");
};

/**
 * 
 * @param {string} format 
 * @param {...*} args
 * @returns {string}
 */
String.format = (format, ...args) => {
    if (!String.isString(format)) {
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
};

/**
 * @readonly
 * @enum {string}
 */
export const Architecture = {
    X86: "x86",
    X64: "x64"
};

/**
 * @readonly
 * @enum {string}
 */
export const Platform = {
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

    if (String.isString(stdout) && stdout.trim() !== "") {
        gutil.log(stdout);
    }

    if (isString(stderr) && stderr.trim() !== "") {
        gutil.log(stderr);
    }
}

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

/**
 * Run a command line under appDir directory.
 * @param {string} cmd - the command line to run.
 */
function appdirExec(cmd) {
    return exec(path.resolve(buildInfos.paths.appDir), cmd);
}

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

/**
 * 
 * @param {string|Array.<string>} [globs]
 * @returns {Array.<string>}
 */
function formGlobs(globs) {
    /** @type {Array.<string>} */
    const outputGlobs = [];
    const basePath = path.resolve(".");

    /** @type {Array.<string>} */
    const patterns = [
        String.format("!{}/**/*", buildInfos.paths.publishDir),
        String.format("!{}/**/*", buildInfos.paths.buildDir),
        String.format("!{}/**/*", "node_modules"),
        "!**/tsconfig.json",
        "!**/jsconfig.json",
        "!**/tslint.json",
        "!./buildInfos.json",
        "!**/*.md"
    ];

    if (isString(globs)) {
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
