//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ipcRenderer } from "electron";
import * as mmutils from "../../module-manager/utils";
import { Communicator } from "../ipc/communicator";

process.once("loaded", async () => {
    const constructorOptions = ipcRenderer.sendSync("request-module-manager-constructor-options");

    global["sfxModuleManager"] = await mmutils.createModuleManagerAsync(constructorOptions, new Communicator(process));
});
