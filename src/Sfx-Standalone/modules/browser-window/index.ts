//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components): Donuts.Modularity.IModuleInfo => {
    components.register<any>({
        name: "browser-window",
        version: shell.getAppVersion(),
        descriptor: require("./browser-window").default,
        deps: ["module-manager"]
    });

    return {
        name: "electron",
        version: shell.getAppVersion()
    };
};
