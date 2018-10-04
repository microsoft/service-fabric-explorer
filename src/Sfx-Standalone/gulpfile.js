//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

const gulp = require("gulp");

gulp.task("build@node-modules",
    () => new Promise((resolve, reject) => {
        const { execSync } = require("child_process");
        const configs = require("cookie.gulp/configs");
        const fs = require("fs");
        const path = require("path");

        try {
            const stat = fs.statSync(path.join(configs.buildInfos.paths.buildDir, "node_modules"));

            if (stat.isDirectory()) {
                return resolve();
            }
        } catch (error) {
            if (!error || error.code !== "ENOENT") {
                return reject(error);
            }
        }

        console.log("NPM", "Executing", `${configs.buildInfos.paths.buildDir}> npm install --production`);
        console.log(execSync("npm install --production", { cwd: configs.buildInfos.paths.buildDir, encoding: "utf8" }));

        resolve();
    }));

require("cookie.gulp")(gulp.registry());