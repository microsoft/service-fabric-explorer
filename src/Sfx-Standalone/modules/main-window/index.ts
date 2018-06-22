//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";

import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";
import { BrowserWindow } from "electron";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "main-window",
        version: electron.app.getVersion(),
        components: [
            {
                name: "main-window",
                version: electron.app.getVersion(),
                descriptor: async (moduleManager) => {
                    const mainWindow = await moduleManager.getComponentAsync("browser-window", null, false);
                    mainWindow.loadURL(resolve("index.html"));
                    return mainWindow;
                },
                deps: ["module-manager"]
            }
        ]
    };
}
