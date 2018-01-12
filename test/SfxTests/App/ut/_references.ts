// It is important to keep this file ordered correctly. Or you'll get runtime errors.
//
// App/tsconfig.json controls the TypeScript compiler options.
// The gulp engine use gulp-typescript to compile this tsconfig.json as a project, 
// by default it includes all .ts files recursively from the App folder (where tsconfig.json is).
// But TypeScript compiler has no clue how to order your .ts file in the secequences they will 
// be needed at runtime except tracking the references directive in every .ts files.
// (https://github.com/Microsoft/TypeScript/issues/3098)
// But putting the references in every .ts files are tedious, ugly and hard to maintain.
//
// This file serves three purposes:
//   a) provides intellisense
//   b) tells TypeScript compiler how to sort the .ts files
//   c) remove the need to add any references directives in other .ts files

/// <reference path="../../../../src/sfx/wwwroot/js/app.min.d.ts" />

/// <reference path="Common/HttpBackendHelper.ts" />


