//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager } from "sfx";

import * as child_process from "child_process";
import { local } from "../utilities/resolve";
import { ModuleManager } from "./module-manager";
import { electron } from "../utilities/electron-adapter";
import { ICommunicator } from "sfx.ipc";

export interface IModuleManagerConstructorOptions {
    hostVersion: string;
    initialModules: Array<string>;
    ipcPath: string;
}

export function createModuleManager(
    options?: IModuleManagerConstructorOptions,
    parentCommunicator?: ICommunicator,
    ipcPath?: string)
    : IModuleManager {

    let hostVersion: string = electron.app.getVersion();
    let initialModules: Array<string> = null;

    if (options) {
        if (options.hostVersion) {
            hostVersion = options.hostVersion;
        }

        if (Array.isArray(options.initialModules)) {
            initialModules = options.initialModules;
        }
    }

    const moduleManager = new ModuleManager(hostVersion);

    if (options) {

    }
}

export function createModuleManagerNodeProcess(
    moduleManager: IModuleManager)
    : child_process.ChildProcess {
    if (!moduleManager) {
        throw new Error("moduleManager must be provided.");
    }

    const options: IModuleManagerConstructorOptions = {
        hostVersion: moduleManager.hostVersion,
        initialModules: moduleManager.loadedModules,
        ipcPath: moduleManager.ipcPath;
    };

    return child_process.fork(local("./bootstrap.js"), [JSON.stringify(options)]);
}
