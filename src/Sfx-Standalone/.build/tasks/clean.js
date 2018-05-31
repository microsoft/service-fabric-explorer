//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const config = require("../config");

const gulp = require("gulp");
const del = require("del");

const buildInfos = config.buildInfos;

gulp.task("clean:build",
    () => del([buildInfos.paths.buildDir]));

gulp.task("clean:publish",
    () => del([buildInfos.paths.publishDir]));
