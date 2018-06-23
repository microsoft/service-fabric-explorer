//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleManager, IModuleLoadingConfig } from "sfx.module-manager";
import { ICommunicator } from "sfx.remoting";

import { ModuleManager } from "./module-manager";
import { getAppVersion } from "../utilities/appUtils";

export interface IModuleManagerConstructorOptions {
    hostVersion: string;
    initialModules: Array<IModuleLoadingConfig>;
}

export const ConstructorOptionsArgName = "constructorOptions";

export async function createModuleManagerAsync(
    options?: IModuleManagerConstructorOptions,
    parentCommunicator?: ICommunicator)
    : Promise<IModuleManager> {
    const hostVersion: string =
        options && String.isString(options.hostVersion) ? options.hostVersion : getAppVersion();

    const initialModules: Array<IModuleLoadingConfig> =
        options && Array.isArray(options.initialModules) ? options.initialModules : null;

    const moduleManager = new ModuleManager(hostVersion, parentCommunicator);

    if (Array.isArray(initialModules)) {
        for (const moduleLoadingInfo of initialModules) {
            await moduleManager.loadModuleAsync(moduleLoadingInfo.location, null, true);
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
        initialModules: moduleManager.loadedModules.filter((info) => info.loadingMode === "Always")
    };
}
