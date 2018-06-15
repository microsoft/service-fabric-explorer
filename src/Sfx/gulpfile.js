/// <binding BeforeBuild="build" Clean="clean" ProjectOpened="watch" />

let gulp = require("gulp");
let merge = require("merge2");
let plugins = require("gulp-load-plugins")({
    pattern: ["*", "!bower", "!typescript", "!tslint"],
    camelize: true,
    lazy: true
});
let libConfiguration = require("./build/lib.json");

// To get production bits, right click project, choose publish.
// This env variable will be set through prepublish command defined in project.json
let isProductionEnv = plugins.yargs.argv.production === undefined ? false : true;

//-----------------------------------------------------------------------------
// Paths
//-----------------------------------------------------------------------------

// Base paths
let paths = {
    webroot: "wwwroot/"
};

// Static files like html, images and fonts
paths.statics = {
    src: ["App/*.html", "App/images/**/*.*", "App/fonts/**/*.*"],
    dest: paths.webroot
};

// VersionInfo.ts
paths.versionInfo = {
    src: "App/Scripts/VersionInfo.ts",
    dest: "App/Scripts"
};

// Angular template files
paths.templates = {
    src: ["App/partials/**/*.html"],
    target: "templates.min.js",
    dest: paths.webroot + "js"
};

// Scripts
paths.scripts = {
    src: [
        "App/Scripts/**/*.ts"
    ],
    target: "app.min.js",
    dtsTarget: "app.min.d.ts",
    dest: paths.webroot + "js"
};

// Styles
paths.styles = {
    src: "App/Styles/**/*.scss",
    themes: [
        {
            src: "App/Styles/Themes/dark.scss",
            target: "dark.min.css",
            dest: paths.webroot + "css"
        },
        {
            src: "App/Styles/Themes/light.scss",
            target: "light.min.css",
            dest: paths.webroot + "css"
        }
    ]
};

// Lib scripts
paths.libs_scripts = {
    target: "lib.min.js",
    dest: paths.scripts.dest
};

// Lib styles
paths.libs_styles = {
    target: "lib.min.css",
    dest: paths.webroot + "css"
};

//-----------------------------------------------------------------------------
// Clean tasks
//-----------------------------------------------------------------------------

gulp.task("clean", function () {
    return plugins.del.sync([paths.webroot + "/*", "!" + paths.webroot + "/bin"]);
});

//-----------------------------------------------------------------------------
// Build tasks
//-----------------------------------------------------------------------------

// Copy static files to wwwroot folder
gulp.task("build:static", function () {
    return gulp.src(paths.statics.src, { base: "App" })
        .pipe(gulp.dest(paths.statics.dest));
});

// Minify and templateCache the Angular Templates
gulp.task("build:templates", function () {
    return gulp.src(paths.templates.src)
        .pipe(plugins.htmlmin())
        .pipe(plugins.angularTemplatecache(paths.templates.target, {
            standalone: true,
            module: "templates",
            root: "partials/"
        }))
        .pipe(gulp.dest(paths.templates.dest));
});

// Inject commit id and build number into VersionInfo.ts
gulp.task("build:versionInfo", function () {
    if (!process.env.BUILD_BUILDNUMBER || !process.env.BUILD_SOURCEVERSION) {
        return;
    }

    return gulp.src(paths.versionInfo.src)
        .pipe(plugins.replace("[Dev]", process.env.BUILD_BUILDNUMBER + "-" + process.env.BUILD_SOURCEVERSION))
        .pipe(gulp.dest(paths.versionInfo.dest));
});

gulp.task("build:lib-js", function () {
    console.log("Lib ordered javascripts:");
    console.log(libConfiguration.js);

    // Create lib.min.js
    return gulp.src(libConfiguration.js)
        .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.init()))
        .pipe(plugins.concat(paths.libs_scripts.target))
        .pipe(plugins.if(isProductionEnv, plugins.uglify({ preserveComments: "license" })))
        .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.write(".", { includeContent: true })))
        .pipe(gulp.dest(paths.libs_scripts.dest));
});

gulp.task("build:lib-css", function () {
    console.log("Lib styles:");
    console.log(libConfiguration.css);

    // Create lib.min.css
    return gulp.src(libConfiguration.css)
        .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.init()))
        .pipe(plugins.concat(paths.libs_styles.target))
        .pipe(plugins.cleanCss())
        .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.write(".", { includeContent: true })))
        .pipe(gulp.dest(paths.libs_styles.dest));
});

// Concat and minify third party libaries
// Uses wiredep to analyse dependencies, custom ordering is done in bower.json via overrides.
gulp.task("build:lib", ["build:lib-js", "build:lib-css"]);

gulp.task("build:tslint", function () {
    // Run tslint for .ts files under App/Scripts folder
    return gulp.src(paths.scripts.src)
        .pipe(plugins.plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit("end");
            }
        }))
        .pipe(plugins.tslint({
            formatter: "prose"
        }))
        .pipe(plugins.tslint.report({
            summarizeFailureOutput: true
        }));
});

// Compile TypeScript, concat/uglify into app.min.js, create sourcemap to help TS debugging
gulp.task("build:js", ["build:templates", "build:versionInfo", "build:tslint"], function () {
    console.log("isProductionEnvironment = " + isProductionEnv);

    let tsProject = plugins.typescript.createProject("App/Scripts/tsconfig.json", {
        outFile: paths.scripts.target
    });

    // tsProject.src() retrieves all .ts files in the folder which contains tsconfig.json
    let result = tsProject.src()
        .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.init()))
        .pipe(tsProject());

    return merge([
        result.js
            .pipe(plugins.if(isProductionEnv, plugins.uglify({ compress: { drop_console: true } })))
            .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.write(".", { includeContent: true })))
            .pipe(gulp.dest(paths.scripts.dest)),
        result.dts.pipe(gulp.dest(paths.scripts.dest))]);
});

// Compile SASS, concat/minify into app.min.css, create sourcemap to help debugging
gulp.task("build:css", function () {
    let compileTheme = function (theme) {
        return gulp.src(theme.src)
            .pipe(plugins.plumber({
                errorHandler: function (err) {
                    console.log(err);
                    this.emit("end");
                }
            }))
            .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.init()))
            .pipe(plugins.sass({ outputStyle: "compressed" }).on("error", plugins.sass.logError))
            .pipe(plugins.concat(theme.target))
            .pipe(plugins.if(!isProductionEnv, plugins.sourcemaps.write(".", { includeContent: true })))
            .pipe(gulp.dest(theme.dest));
    };

    let streams = [];

    // Compile all themes
    paths.styles.themes.forEach(function (theme) {
        streams.push(compileTheme(theme));
    });

    return merge(streams);
});

// Build
gulp.task("build", ["build:lib", "build:static", "build:js", "build:css"]);

// Clean build
gulp.task("clean-build", function (callback) {
    plugins.runSequence("clean", "build", callback);
});

//-----------------------------------------------------------------------------
// Watch tasks
//-----------------------------------------------------------------------------

// Watch task which monitor all TS and SCSS file changes
gulp.task("watch", ["build"], function () {
    gulp.watch(paths.statics.src, ["build:static"]);
    gulp.watch(paths.styles.src, ["build:css"]);
    gulp.watch([paths.scripts.src, paths.templates.src], ["build:js"]);
});