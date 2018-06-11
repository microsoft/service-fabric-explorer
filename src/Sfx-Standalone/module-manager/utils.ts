//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager } from "sfx";
import { ICommunicator } from "sfx.remoting";

import { ModuleManager } from "./module-manager";
import { electron } from "../utilities/electron-adapter";

export interface IModuleManagerConstructorOptions {
    hostVersion: string;
    initialModules: Array<string>;
}

export async function createModuleManagerAsync(
    options?: IModuleManagerConstructorOptions,
    parentCommunicator?: ICommunicator)
    : Promise<IModuleManager> {
    const hostVersion: string =
        options && String.isString(options.hostVersion) ? options.hostVersion : electron.app.getVersion();

    const initialModules: Array<string> =
        options && Array.isArray(options.initialModules) ? options.initialModules : null;

    const moduleManager = new ModuleManager(hostVersion, parentCommunicator);

    if (Array.isArray(initialModules)) {
        for (const modulePath of initialModules) {
            await moduleManager.loadModuleAsync(modulePath, null, true);
        }
    }

    return moduleManager;
}

export function generateModuleManagerConstructorOptions(
    moduleManager: IModuleManager)
    : IModuleManagerConstructorOptions {
    if (!moduleManager) {
        throw new Error("moduleManager must be provided.");
    }

    return {
        hostVersion: moduleManager.hostVersion,
        initialModules: moduleManager.loadedModules
    };
}
