//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";

import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";
import { BrowserWindow } from "electron";
import { LocalSfxVueComponent, MainWindow } from "./main-window";

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
                    //mainWindow.loadURL(resolve("index.html"));
                    
                    //this.browserWindow.loadURL(resolve("index.html"));
                    const m = new MainWindow(mainWindow);
                    m.register(new LocalSfxVueComponent(""));
                    return m;
                },
                deps: ["module-manager"]
            }
            // ,
            // {
            //     name: "cluster-manager",
            //     version: electron.app.getVersion(),
            //     descriptor: async (moduleManager) => {
            //         const m = new LocalSfxVueComponent("");

            //         const mainWindow = await moduleManager.getComponentAsync("main-window", null, false);
            //         mainWindow.register(m);                   

            //         return m;
            //     },
            //     deps: ["module-manager", "main-window"]
            // }
        ]
    };
}
