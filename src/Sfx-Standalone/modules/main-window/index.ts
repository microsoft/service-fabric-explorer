//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as shell from "donuts.node/shell";
import { IMainWindow } from "sfx.main-window";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IMainWindow>({
        name: "main-window",
        version: shell.getAppVersion(),
        singleton: true,
        descriptor: (browserWindow) => import("./main-window").then((module) => new module.MainWindow(browserWindow)),
        deps: ["electron.browser-window"]
    });

    return {
        name: "sfx",
        version: shell.getAppVersion(),
    };
};
