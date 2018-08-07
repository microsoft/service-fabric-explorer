//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/**
 * Bootstrap the host environment for modules. 
 */

import { IModuleManagerConstructorOptions } from "sfx.module-manager";
import { ICommunicator } from "sfx.remoting";

import "../utilities/utils";
import * as simpleContext from "./simple-context";

import * as electron from "electron";

import * as appUtils from "../utilities/appUtils";
import { Communicator } from "../modules/ipc/communicator";
import { ModuleManager } from "./module-manager";

const bootstrapPromise: Promise<void> = ((): Promise<any> => {
    appUtils.logUnhandledRejection();

    let constructorOptions: IModuleManagerConstructorOptions;
    let communicator: ICommunicator;

    if (electron.ipcMain) { // Electron main process
        communicator = undefined;
        constructorOptions = {
            hostVersion: appUtils.getAppVersion()
        };

    } else if (electron.ipcRenderer) { // Electron renderer
        const contextId = `ModuleManagerConstructorOptions-${electron.remote.getCurrentWindow().id}`;
        
        communicator = Communicator.fromChannel(electron.ipcRenderer);

        if (electron.remote.getCurrentWindow().webContents.id === electron.remote.getCurrentWebContents().id) {
            constructorOptions = JSON.parse(appUtils.getCmdArg(ModuleManager.ConstructorOptionsCmdArgName));
            simpleContext.writeContext(contextId, constructorOptions);
        } else {
            constructorOptions = simpleContext.readContext(contextId);
        }
    } else { // Node.js process
        communicator = Communicator.fromChannel(process);
        constructorOptions = JSON.parse(appUtils.getCmdArg(ModuleManager.ConstructorOptionsCmdArgName));
    }

    const moduleManager = new ModuleManager(constructorOptions.hostVersion, communicator);

    appUtils.injectModuleManager(moduleManager);

    if (Array.isArray(constructorOptions.initialModules)) {
        return Promise.all(
            constructorOptions.initialModules.map<Promise<void>>(
                (moduleLoadingInfo) => moduleManager.loadModuleAsync(moduleLoadingInfo.location, undefined, true)));
    }

    return Promise.resolve();
})();

export default bootstrapPromise;
