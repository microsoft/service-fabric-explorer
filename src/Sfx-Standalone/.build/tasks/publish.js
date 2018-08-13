//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const gulp = require("gulp");

const Platform = common.Platform;

/**
 * Convert the platform of nodejs to common.Platform.
 * @param {string} platform The platform of nodejs.
 * @returns {stirng} The corresponding common.Platform.
 */
function normalizePlatform(platform) {
    switch (platform) {
        case "linux": return Platform.Linux;
        case "darwin": return Platform.MacOs;
        case "win32": return Platform.Windows;
        default:
            throw new Error("Not supported platform: " + platform);
    }
}

require("./publish.prepare");
require("./publish.windows");
require("./publish.linux");
require("./publish.macos");

gulp.task("publish",
    gulp.series(
        "clean:publish",
        `publish:${normalizePlatform(process.platform)}`));
