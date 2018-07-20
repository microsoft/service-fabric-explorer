//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
import { IModuleInfo, IModule } from "sfx.module-manager";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components.register<any>({
        name: "browser-window",
        version: appUtils.getAppVersion(),
        descriptor: () => require("./browser-window").default,
        deps: ["module-manager"]
    });

    return {
        name: "browser-window",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
