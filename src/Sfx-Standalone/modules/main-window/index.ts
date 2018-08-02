//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { electron } from "../../utilities/electron-adapter";
import { MainWindow } from "./main-window";

(<IModule>exports).getModuleMetadata = (components) => {
    components.register<MainWindow>({
        name: "main-window",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: async (browserWindow) => {        
                    return new MainWindow(browserWindow);
                },
                deps: ["browser-window"]
    });

    return {
        name: "main-window",
        version: electron.app.getVersion()
    };
};
