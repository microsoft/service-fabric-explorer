//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

const gulp = require("gulp");
const gutil = require("gulp-util");
const del = require("del");
const fs = require("fs");
const util = require("util");
const runSequence = require("run-sequence");
const ts = require("typescript");

const tsc = require("./.build/tsc");
const packagejson = require("./package.json");
const buildInfos = require("./buildInfos.json");

const exec = require("child_process").execSync;

// Please ensure all the dependencies above is under package.json/devDependencies or dependencies.

function isString(value) {
    return typeof value === "string" || value instanceof String;
}

gulp.task("npm:Install-sfx-dependencies",
    function () {
        const dependencyTypeToArg = {
            "dev": "--no-save",
            "prod": "-P"
        };

        const isInstalled = function (moduleName) {
            try {
                require.resolve(moduleName);
                return true;
            } catch (error) {
                return false;
            }
        };

        const logSkipping = function (dependencyName, propertyName, propertyValue, currentValue) {
            gutil.log("Skipping sfx-dependency:", dependencyName, propertyName, "=>", "required:" + propertyValue, "current:" + currentValue);
        }

        for (const dependencyName in packagejson.sfxDependencies) {
            if (!isInstalled(dependencyName)) {
                const dependency = packagejson.sfxDependencies[dependencyName];
                let versionArg = "";

                let dependencyTypeArgs = "";

                if (isString(dependency.platform) && dependency.platform !== process.platform) {
                    logSkipping(dependencyName, "Platform", dependency.platform, process.platform);
                    continue;
                }

                if (isString(dependency.arch) && dependency.arch !== process.arch) {
                    logSkipping(dependencyName, "Arch", dependency.arch, process.arch);
                    continue;
                }

                if (!Array.isArray(dependency.dependencyTypes)) {
                    dependency.dependencyTypes = ["dev"];
                }

                dependency.dependencyTypes.forEach(typeName => dependencyTypeArgs += dependencyTypeToArg[typeName] + " ");

                if (dependency.version) {
                    versionArg += "@" + dependency.version;
                }

                let cmd = util.format("npm install %s%s %s", dependencyName, versionArg, dependencyTypeArgs);

                gutil.log(cmd, "\r\n", exec(cmd, { encoding: "utf8" }));
            }
        }
    });

gulp.task("Build:gulp-ts", ["npm:Install-sfx-dependencies"],
    function () {
        tsc.compile(
            {
                target: ts.ScriptTarget.ES2015,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                sourceMap: true,
                declaration: false
            },
            ["gulp.ts"]);
    });

gulp.task("Import:gulp-ts", ["Build:gulp-ts"],
    function () {
        require("./gulp.js");
    });

gulp.task("Build", ["Import:gulp-ts"],
    function (callback) {
        runSequence("Build:All", callback);
    });

gulp.task("Clean",
    function () {
        return del([
            buildInfos.paths.buildDir,
            buildInfos.paths.publishDir]);
    });

gulp.task("Pack", ["Clean", "Import:gulp-ts"],
    function (callback) {
        runSequence("Pack:" + process.platform, callback);
    });

gulp.task("Publish", ["Clean", "Import:gulp-ts"],
    function (callback) {
        runSequence("Publish:" + process.platform, callback);
    });

gulp.task("Clean-Build",
    function (callback) {
        runSequence("Clean", "Build", callback);
    });
