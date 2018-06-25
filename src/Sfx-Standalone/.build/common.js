//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";


const path = require("path");

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
                    throw new Error(utils.format("Referenced arg index, '{}',is out of range of the args.", argIndexStr));
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
        isNullUndefinedOrEmpty: (value) => value === undefined || value === null || (utils.isString(value) && value === ""),

        /**
         * Check if the given string, value, is null/undefined/empty string/whitespaces.
         * @readonly
         * @param {*} value The given string to check.
         * @returns {boolean} True if the given string, value, is null/undefined/empty string. Otherwise, false.
         */
        isNullUndefinedOrWhitespaces: (value) => value === undefined || value === null || (utils.isString(value) && value.trim() === "")
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
