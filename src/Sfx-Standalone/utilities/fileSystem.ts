//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as path from "path";
import * as fs from "fs";

import "./utils";

export function ensureDirExists(dirname: string): void {
    if (!String.isString(dirname)) {
        throw new Error("dirname should be a string.");
    }

    dirname = path.resolve(dirname);

    const dirs: Array<string> = [];

    while (!fs.existsSync(dirname)) {
        dirs.push(dirname);
        dirname = path.dirname(dirname);
    }

    while (dirs.length > 0) {
        fs.mkdirSync(dirs.pop());
    }
}

export function rmdir(dirname: string): void {
    if (!String.isString(dirname)) {
        throw new Error("dirname should be a string.");
    }

    dirname = path.resolve(dirname);

    if (!fs.existsSync(dirname)) {
        return;
    }

    for (const subName of fs.readdirSync(dirname)) {
        const subDirName = path.join(dirname, subName);
        const stat = fs.statSync(subDirName);

        if (stat.isDirectory()) {
            rmdir(subDirName);
        } else {
            fs.unlinkSync(subDirName);
        }
    }

    fs.rmdirSync(dirname);
}
