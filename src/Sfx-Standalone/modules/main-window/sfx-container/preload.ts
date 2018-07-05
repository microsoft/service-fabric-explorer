//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ipcRenderer } from "electron";
import * as appUtils from "../../../utilities/appUtils";
import * as mmutils from "../../../module-manager/utils";
import { Communicator } from "../../ipc/communicator";

global["exports"] = exports;

appUtils.logUnhandledRejection();

process.once("loaded", async () => {
    const constructorOptions = ipcRenderer.sendSync("request-module-manager-constructor-options-component");
    const communicator = Communicator.fromChannel(ipcRenderer);
    appUtils.injectModuleManager(await mmutils.createModuleManagerAsync(constructorOptions, communicator));

    console.log(sfxModuleManager);
   
    global["communicator"] = communicator;
    console.log("done");
});
