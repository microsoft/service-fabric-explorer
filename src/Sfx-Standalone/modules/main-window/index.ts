//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { MainWindow } from "./main-window";
import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<MainWindow>({
        name: "main-window",
        version: shell.getAppVersion(),
        singleton: true,
        descriptor: async (browserWindow) => {
            return new MainWindow(browserWindow);
        },
        deps: ["electron.browser-window"]
    });

    return {
        name: "sfx",
        version: shell.getAppVersion(),
    };
};
