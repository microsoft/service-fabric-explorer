//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ipcRenderer } from "electron";
import * as appUtils from "../../../utilities/appUtils";
import { Communicator } from "../../ipc/communicator";

global["exports"] = exports;

appUtils.logUnhandledRejection();

process.once("loaded", async () => {
    
});
