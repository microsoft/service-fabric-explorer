//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";

import * as utils from "./utils";

import * as fs from "fs";
import * as child_process from "child_process";

import { env, Platform } from "./env";
import { local } from "./resolve";

let inspectPort: number = 17000;

const CmdArgParseFormat = /^\s*\-\-([a-zA-Z0-9_\-+@]+)\=?(.*)$/g;

function getInspectPort(): number {
    return inspectPort++;
}

export function getIconPath(): string {
    switch (env.platform) {
        case Platform.Windows:
            return local("../icons/icon.ico");

        case Platform.MacOs:
            return local("../icons/icon.icns");

        case Platform.Linux:
        default:
            return local("../icons/icon128x128.png");
    }
}

export function toCmdArg(argName: string, argValue: string): string {
    return `--${argName}=${argValue}`;
}

export function toCmdArgs(argDict: IDictionary<string>): Array<string> {
    if (!utils.isNullOrUndefined(argDict)
        && (!Object.isObject(argDict) || Array.isArray(argDict))) {
        throw new Error("argDict must be an IDictionary<string>.");
    }

    const args = new Array<string>();

    for (const key in argDict) {
        args.push(`--${key}=${argDict[key]}`);
    }

    return args;
}

export function toArgDict(args: Array<string>): IDictionary<string> {
    if (!Array.isArray(args)) {
        throw new Error("args must be an array of string.");
    }

    const argDict: IDictionary<string> = Object.create(null);

    for (const arg of args) {
        let matchResult: RegExpExecArray;

        while (matchResult = CmdArgParseFormat.exec(arg)) {
            argDict[matchResult[1]] = matchResult[2];
        }
    }

    return argDict;
}

export function getCmdArg(argName: string): string {
    const argDict = toArgDict(process.argv);

    return argDict[argName];
}

export function fork(modulePath: string, forkArgs: Array<string>): child_process.ChildProcess {
    if (!String.isString(modulePath) || String.isEmptyOrWhitespace(modulePath)) {
        throw new Error("modulePath must be provided.");
    }

    if (!utils.isNullOrUndefined(forkArgs) && !Array.isArray(forkArgs)) {
        throw new Error("forkArgs must be an array of string.");
    }

    const args = new Array<string>();

    if (Array.isArray(process.argv)) {
        if (0 <= process.argv.findIndex((arg) => arg.startsWith("--inspect-brk"))) {
            args.push("--inspect-brk=" + getInspectPort().toString());
        }
    }

    if (forkArgs) {
        args.push(...forkArgs);
    }

    return child_process.fork(modulePath, args);
}

export function getAppVersion(): string {
    const packageJson = JSON.parse(fs.readFileSync(local("./package.json", true), { encoding: "utf8" }));

    return packageJson.version;
}
