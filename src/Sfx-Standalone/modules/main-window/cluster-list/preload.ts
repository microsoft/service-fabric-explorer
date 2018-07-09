//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as electron from "electron";
import * as appUtils from "../../../utilities/appUtils";
import { Communicator } from "../../../modules/ipc/communicator";
import { ModuleManager } from "../../../module-manager/module-manager";

global["exports"] = exports;

process.once("loaded", async () => {
    if (electron.ipcMain) {
        appUtils.injectModuleManager(new ModuleManager(appUtils.getAppVersion()));
        return;
    }
    
    const moduleManager = new ModuleManager("1.0.0", Communicator.fromChannel(electron.ipcRenderer || process));

    appUtils.injectModuleManager(moduleManager);
});
