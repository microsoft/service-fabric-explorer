//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/**
 * Bootstrap the host environment for modules. 
 */

import "../utilities/utils";

import { ChannelType } from "sfx.ipc";

import * as electron from "electron";

import * as appUtils from "../utilities/appUtils";
import { Communicator } from "../modules/ipc/communicator";
import { ModuleManager, IModuleManagerConstructorOptions, Patterns, IModuleManagerMessage, ModuleManagerAction } from "./module-manager";

appUtils.logUnhandledRejection();

exports = (async (): Promise<void> => {
    const channel: ChannelType = electron.ipcMain ? undefined : electron.ipcRenderer || process;

    if (!channel) {
        appUtils.injectModuleManager(new ModuleManager(appUtils.getAppVersion()));
        return;
    }

    console.log("creating communicator...");

    const communicator = Communicator.fromChannel(channel);

    console.log("Getting constructorOptions ...");
    let constructorOptions;
    try {
        constructorOptions =
            await communicator.sendAsync<IModuleManagerMessage, IModuleManagerConstructorOptions>(
                Patterns.ModuleManager.getRaw(),
                {
                    action: ModuleManagerAction.requestConstructorOptions,
                    content: undefined
                });
    } catch (err) {
        console.log(err);
    }
    console.log("got constructorOptions", constructorOptions);
    const moduleManager = new ModuleManager(constructorOptions.hostVersion, communicator);

    console.log("injecting module manager...");
    appUtils.injectModuleManager(moduleManager);

    if (Array.isArray(constructorOptions.initialModules)) {
        for (const moduleLoadingInfo of constructorOptions.initialModules) {
            await moduleManager.loadModuleAsync(moduleLoadingInfo.location, null, true);
        }
    }
})();
