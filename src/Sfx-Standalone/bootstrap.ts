//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as shell from "donuts.node/shell";
import * as appUtils from "./utilities/appUtils";
import { bootstrap  } from "./bootstrap.module-manager";

// TODO: Remove startupMainWindow once the main frame is ready.
import startupMainWindow from "./main";

appUtils.logUnhandledRejection();

process.once("loaded", () => bootstrap()
    // Load ad-hoc module
    .then((moduleManager) => {
        const adhocModuleArg = shell.getCmdArg("adhocModule");

        if (adhocModuleArg) {
            return moduleManager.loadModulesAsync([adhocModuleArg]);
        }

        return Promise.resolve(moduleManager);
    })

    // Start up main window.
    .then((moduleManager) => startupMainWindow())
);
