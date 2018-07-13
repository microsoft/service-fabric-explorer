//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { electron } from "../../utilities/electron-adapter";
import { MainWindow } from "./main-window";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "main-window",
        version: electron.app.getVersion(),
        components: [
            {
                name: "main-window",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: async (moduleManager) => {
                    const browserWindow = await moduleManager.getComponentAsync("browser-window", null, false);
                    return new MainWindow(moduleManager, browserWindow);
                },
                deps: ["module-manager"]
            }
        ]
    };
}
