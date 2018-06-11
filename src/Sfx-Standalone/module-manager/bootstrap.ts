//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ModuleManager } from "./module-manager";
import { NodeCommunicator } from "../modules/ipc/communicator.node";

(async () => {
    const moduleManager = new ModuleManager(process.argv0, new NodeCommunicator(process));

    global["sfxModuleManager"] = moduleManager;

    console.log("bootstrap: moduleManager");
    console.log(moduleManager);

    console.log("bootstrap: global['sfxModuleManager']");
    console.log(global["sfxModuleManager"]);

    for (let argIndex = 1; argIndex < process.argv.length; argIndex++) {
        await moduleManager.loadModuleDirAsync(process.argv[argIndex], null, true);
    }
})();
