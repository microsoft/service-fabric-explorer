//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

// Bootstrap the global utilities.
import "./utilities/utils";

import * as appUtils from "./utilities/appUtils";
import { ModuleManager } from "./module-manager/module-manager";

// TODO: Remove startupMainWindow once the main frame is ready.
import startupMainWindow from "./main";

global["sfxModuleManager"] = new ModuleManager(appUtils.getAppVersion());

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

Promise.resolve()
    // Load built-in modules.
    .then(() => sfxModuleManager.loadModuleDirAsync(appUtils.local("modules")))

    // Load extension modules.
    .then(() => sfxModuleManager.getComponentAsync("package-manager"))
    .then((packageManager) => sfxModuleManager.loadModuleDirAsync(packageManager.packagesDir, "extensions"))

    // Load ad-hoc module
    .then(() => {
        const adhocModuleArg = appUtils.getCmdArg("adhocModule");

        if (adhocModuleArg) {
            return sfxModuleManager.loadModuleAsync(adhocModuleArg, "extensions");
        }

        return Promise.resolve();
    })

    // Start up main window.
    .then(() => startupMainWindow());
