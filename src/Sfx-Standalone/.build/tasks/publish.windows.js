//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

"use strict";

const common = require("../common");
const utilities = require("../utilities");
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

gulp.task("publish:versioninfo@windows",
    () =>
        Promise.resolve(versioning.generateVersionInfo(
            Platform.Windows,
            (baseUrl, arch) => utils.format("{}/setup-{}.{}.msi", baseUrl, buildInfos.buildNumber, arch))));

gulp.task("publish:msi@copy-msi.wxs",
    () =>
        Promise.resolve(
            fs.copyFileSync(
                "./.build/msi.wxs",
                path.join(buildInfos.paths.buildDir, "msi.wxs"))));

gulp.task("publish:msi@write-version",
    () => {
        const wxsPath = path.resolve(path.join(buildInfos.paths.buildDir, "msi.wxs"));

        fs.writeFileSync(
            wxsPath,
            fs.readFileSync(wxsPath, { encoding: "utf8" })
                .replace("$MSIVERSION$", [semver.major(buildInfos.buildNumber), semver.minor(buildInfos.buildNumber), semver.patch(buildInfos.buildNumber)].join(".")),
            { encoding: "utf8" });

        return Promise.resolve();
    });

gulp.task("publish:msi@update-version",
    gulp.series("publish:msi@copy-msi.wxs", "publish:msi@write-version"));

gulp.task("publish:msi@build-msi",
    () => {
        const packDirName = utils.format("{}-{}-{}", buildInfos.targetExecutableName, pack.toPackagerPlatform(Platform.Windows), pack.toPackagerArch(Architecture.X86));
        const packDirPath = path.resolve(path.join(buildInfos.paths.buildDir, packDirName));
        const publishDir = path.join(buildInfos.paths.publishDir, Platform.Windows);
        const filesWixPath = path.resolve(path.join(buildInfos.paths.buildDir, "files.msi.wxs"));
        const filesWixXsltPath = path.resolve("./.build/files.msi.wxs.xslt");
        const wxsobjDir = path.resolve(path.join(buildInfos.paths.buildDir, "wxsobj"));
        const heatPath = path.resolve("./.vendor/wix/heat.exe");
        const candlePath = path.resolve("./.vendor/wix/candle.exe");
        const lightPath = path.resolve("./.vendor/wix/light.exe");
        const heatCmd = utils.format("\"{}\" dir \"{}\" -ag -srd -cg MainComponentsGroup -dr INSTALLFOLDER -o \"{}\" -t \"{}\"", heatPath, packDirPath, filesWixPath, filesWixXsltPath);
        const updateGuidCmd = utils.format("powershell \"{}\" -XmlPath \"{}\"", path.resolve("./.build/tasks/publish.windows.update-guid.ps1"), filesWixPath);
        const candleCmd = utils.format("\"{}\" -arch x86 -out \"{}\\\\\" \"{}\" \"{}\"", candlePath, wxsobjDir, path.resolve(path.join(buildInfos.paths.buildDir, "msi.wxs")), filesWixPath);
        const lightCmd =
            utils.format(
                "\"{}\" -b \"{}\" -spdb -out \"{}\" \"{}\" \"{}\" -sice:ICE60 -sice:ICE91",
                lightPath,
                packDirPath,
                path.resolve(path.join(publishDir, buildInfos.buildNumber ? utils.format("setup-{}.x86.msi", buildInfos.buildNumber) : "setup.x86.msi")),
                path.join(wxsobjDir, "msi.wixobj"), path.join(wxsobjDir, "files.msi.wixobj"));

        return utilities.appdirExec(heatCmd)
            .then(() => utilities.appdirExec(updateGuidCmd))
            .then(() => utilities.appdirExec(candleCmd))
            .then(() => utilities.appdirExec(lightCmd));
    });

gulp.task("publish:msi",
    gulp.series(
        gulp.parallel("publish:msi@update-version", "publish:prepare"),
        "publish:msi@build-msi"));

gulp.task("publish:windows",
    gulp.series(
        "pack:windows",
        gulp.parallel("publish:versioninfo@windows", "publish:msi")));