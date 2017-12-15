var gulp = require("gulp");
var typescript = require("gulp-typescript");
var gutil = require("gulp-util");
var util = require("util");
var del = require("del");
var fs = require("fs");
var runSequence = require("run-sequence");
var packagejson = require("./package.json");
var buildInfos = require("./buildInfos.json");
var exec = require("child_process").execSync;

// Please ensure all the dependencies above is under package.json/devDependencies or dependencies.

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

        for (var dependencyName in packagejson.sfxDependencies) {
            if (!isInstalled(dependencyName)) {
                var dependency = packagejson.sfxDependencies[dependencyName];
                var dependencyTypeArgs = "";
                var versionArg = "";

                if (util.isString(dependency.platform) && dependency.platform !== process.platform) {
                    logSkipping(dependencyName, "Platform", dependency.platform, process.platform);
                    continue;
                }

                if (util.isString(dependency.arch) && dependency.arch !== process.arch) {
                    logSkipping(dependencyName, "Arch", dependency.arch, process.arch);
                    continue;
                }

                if (!util.isArray(dependency.dependencyTypes)) {
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
        return gulp.src(["gulp.ts"])
            .pipe(typescript())
            .pipe(gulp.dest("."));
    });

gulp.task("Import:gulp-ts", ["Build:gulp-ts"],
    function () {
        require("./gulp.js");
    });

gulp.task("Build", ["Import:gulp-ts"],
    function (callback) {
        runSequence("Build:All", callback);
    });

gulp.task("Clean", ["Import:gulp-ts"],
    function () {
        return del([
            buildInfos.paths.buildDir,
            buildInfos.paths.publishDir]);
    });

gulp.task("Publish", ["Clean-Build", "Import:gulp-ts"],
    function (callback) {
        runSequence("Publish:" + process.platform, callback);
    });

gulp.task("Publish-Linux", ["Clean-Build", "Import:gulp-ts"],
    function (callback) {
        runSequence("Publish:linux", callback);
    });

gulp.task("Publish-Windows", ["Clean-Build", "Import:gulp-ts"],
    function (callback) {
        runSequence("Publish:win32", callback);
    });

gulp.task("Publish-macOS", ["Clean-Build", "Import:gulp-ts"],
    function (callback) {
        runSequence("Publish:darwin", callback);
    });

gulp.task("Clean-Build",
    function (callback) {
        runSequence("Clean", "Build", callback);
    });
