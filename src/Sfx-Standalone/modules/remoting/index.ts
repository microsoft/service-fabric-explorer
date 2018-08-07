//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo, IModule } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<any>({
            name: "remoting.utils",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: () => import("./utils").then((module) => new module.Utils())
        })
        .register<any>({
            name: "remoting.pattern.string",
            version: appUtils.getAppVersion(),
            singleton: false,
            descriptor: (pattern: string) => import("./pattern/string").then((module) => new module.default(pattern))
        })
        .register<any>({
            name: "remoting.pattern.regex",
            version: appUtils.getAppVersion(),
            singleton: false,
            descriptor: (pattern: RegExp) => import("./pattern/regex").then((module) => new module.default(pattern))
        });

    return {
        name: "remoting",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
