//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

const gulp = require("gulp");
const { execSync } = require("child_process");

const configs = require("cookie.gulp/configs");

gulp.task("pack@node-modules",
    () => {
        console.log("NPM", "Executing", `${configs.buildInfos.paths.buildDir}> npm install --production`);
        console.log(execSync("npm install --production", { cwd: configs.buildInfos.paths.buildDir, encoding: "utf8" }));

        return Promise.resolve();
    });

require("cookie.gulp")();