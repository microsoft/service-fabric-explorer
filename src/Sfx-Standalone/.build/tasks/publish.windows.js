//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const pack = require("./pack");
const config = require("../config");
const versioning = require("../versioning");

const path = require("path");
const gulp = require("gulp");
const fs = require("fs");
const semver = require("semver");

const Architecture = common.Architecture;
const Platform = common.Platform;
const buildInfos = config.buildInfos;
const utils = common.utils;

gulp.task("publish:versioninfo-windows",
    (done) => { versioning.generateVersionInfo(
        Platform.Windows,
        (baseUrl, arch) => utils.format("{}/setup-{}.{}.msi", baseUrl, buildInfos.buildNumber, arch));
        
        done();
    });

gulp.task("publish:copy-msi.wxs",
    () => gulp.src(common.formGlobs("./.build/msi.wxs")).pipe(gulp.dest(buildInfos.paths.buildDir)));

gulp.task("publish:update-wix-version", gulp.series("publish:copy-msi.wxs",
    (done) => {
        const wxsPath = path.resolve(path.join(buildInfos.paths.buildDir, "./.build/msi.wxs"));

        fs.writeFileSync(
            wxsPath,
            fs.readFileSync(wxsPath, { encoding: "utf8" })
                .replace("$MSIVERSION$", [semver.major(buildInfos.buildNumber), semver.minor(buildInfos.buildNumber), semver.patch(buildInfos.buildNumber)].join(".")),
            { encoding: "utf8" });

        done();
    }));

gulp.task("publish:msi", gulp.series(gulp.parallel("publish:update-wix-version", "publish:prepare"),
    () => {
        const packDirName = utils.format("{}-{}-{}", buildInfos.targetExecutableName, pack.toPackagerPlatform(Platform.Windows), pack.toPackagerArch(Architecture.X86));
        const packDirPath = path.resolve(path.join(buildInfos.paths.buildDir, packDirName));
        const publishDir = path.join(buildInfos.paths.publishDir, Platform.Windows);
        const filesWixPath = path.resolve(path.join(buildInfos.paths.buildDir, "files.msi.wxs"));
        const wxsobjDir = path.resolve(path.join(buildInfos.paths.buildDir, "wxsobj"));
        const heatPath = path.resolve("./.vendor/wix/heat.exe");
        const candlePath = path.resolve("./.vendor/wix/candle.exe");
        const lightPath = path.resolve("./.vendor/wix/light.exe");
        const heatCmd = utils.format("\"{}\" dir \"{}\" -ag -srd -cg MainComponentsGroup -dr INSTALLFOLDER -o \"{}\"", heatPath, packDirPath, filesWixPath);
        const candleCmd = utils.format("\"{}\" -arch x86 -out \"{}\\\\\" \"{}\" \"{}\"", candlePath, wxsobjDir, path.resolve(path.join(buildInfos.paths.buildDir, "./.build/msi.wxs")), filesWixPath);
        const lightCmd =
            utils.format(
                "\"{}\" -b \"{}\" -spdb -out \"{}\" \"{}\" \"{}\"",
                lightPath,
                packDirPath,
                path.resolve(path.join(publishDir, buildInfos.buildNumber ? utils.format("setup-{}.x86.msi", buildInfos.buildNumber) : "setup.x86.msi")),
                path.join(wxsobjDir, "msi.wixobj"), path.join(wxsobjDir, "files.msi.wixobj"));

        return common.appdirExec(heatCmd)
            .then(() => common.appdirExec(candleCmd)
                .then(() => common.appdirExec(lightCmd)));
    }));

gulp.task("publish:windows", gulp.series("pack:windows", gulp.parallel("publish:versioninfo-windows", "publish:msi")));