//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const path = require("path");
const ts = require("typescript");

function writeMessage(category, message) {
    let logFunc;

    switch (category) {
        case ts.DiagnosticCategory.Error:
            logFunc = console.error;
        case ts.DiagnosticCategory.Warning:
            logFunc = console.warn;
        case ts.DiagnosticCategory.Message:
            logFunc = console.info;

        default:
            logFunc = console.log;
    }

    logFunc(`[${ts.DiagnosticCategory[category]}] ${message}`);
}

function logDiagnostic(diagnostic, basePath) {
    if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const fileName = typeof basePath === "string" || basePath instanceof String ? path.relative(basePath, path.resolve(diagnostic.file.fileName)) : "";

        writeMessage(diagnostic.category, `${fileName} (${line + 1},${character + 1}): ${message}`)
    }
    else {
        writeMessage(diagnostic.category, `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
}

exports.logDiagnostic = logDiagnostic;

exports.compile = function (options, fileNames) {
    const program = ts.createProgram(fileNames, options);
    const emitResult = program.emit();
    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    const basePath = path.resolve(".");

    let hasError = false;

    allDiagnostics.forEach(diagnostic => {
        hasError |= diagnostic.category === ts.DiagnosticCategory.Error;
        logDiagnostic(diagnostic, basePath);
    });

    if (hasError || emitResult.emitSkipped) {
        throw new Error("Typescript compilation failed.");
    }
}