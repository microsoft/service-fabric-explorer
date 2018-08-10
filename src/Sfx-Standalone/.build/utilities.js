//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const common = require("./common");
const config = require("./config");

const path = require("path");
const log = require("fancy-log");
const fs = require("fs");
const child_process = require("child_process");
const pify = require("pify");

const utils = common.utils;
const pified_exec = pify(child_process.exec, { multiArgs: true });
const buildInfos = config.buildInfos;

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
            "!**/settings.json",
            "!./.build/buildInfos.json",
            "!**/*.md"
        ];

        if (utils.isString(globs)) {
            outputGlobs.push(common.normalizeGlob(globs, basePath));
        }
        else if (Array.isArray(globs)) {
            globs.forEach((glob) => outputGlobs.push(common.normalizeGlob(glob, basePath)));
        }
        else if (!isNullOrUndefined(globs)) {
            throw "Unsupported globs: " + typeof globs;
        }

        patterns.forEach((pattern) => outputGlobs.push(common.normalizeGlob(pattern, basePath)));

        return outputGlobs;
    };

/**
 * Log everything of the output of the command line.
 * @param {string} cmd - The command line to run.
 * @param {*} pifyResults - The pify results.
 */
function logExec(cmd, pifyResults) {
    const [error, stdout, stderr] = pifyResults;

    log.info("Executed:", cmd);

    if (utils.isString(stdout) && stdout.trim() !== "") {
        log.info(stdout);
    }

    if (utils.isString(stderr) && stderr.trim() !== "") {
        log.info(stderr);
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
    };