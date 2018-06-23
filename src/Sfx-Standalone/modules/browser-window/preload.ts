//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ipcRenderer } from "electron";

import "../../utilities/utils";

import * as mmutils from "../../module-manager/utils";
import { Communicator } from "../ipc/communicator";

// TODO: Remove global.exports when the node v10 is integrated with electron.
global["exports"] = exports;

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled promise rejection: ", promise);
    console.log("  reason: ", reason);

    if (sfxModuleManager) {
        sfxModuleManager.getComponentAsync("logging")
            .then((log) => {
                if (log) {
                    log.writeError("Unhandled promise rejection: {}", reason);
                }
            });
    }
});

process.once("loaded", async () => {
    const constructorOptions = ipcRenderer.sendSync("request-module-manager-constructor-options");

    global["sfxModuleManager"] = await mmutils.createModuleManagerAsync(constructorOptions, new Communicator(ipcRenderer));
});
