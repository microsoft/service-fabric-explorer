//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

// Bootstrap the module host environment.
import "./module-manager/bootstrap";

import * as appUtils from "./utilities/appUtils";

// TODO: Remove startupMainWindow once the main frame is ready.
import startupMainWindow from "./main";

process.once("loaded", () => Promise.resolve()
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
    .then(() => startupMainWindow())
);
