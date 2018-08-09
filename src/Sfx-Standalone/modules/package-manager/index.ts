//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule, IModuleInfo, IModuleManager } from "sfx.module-manager";
import { IPackageManager } from "sfx.package-manager";
import { ISettings } from "sfx.settings";
import { IHttpClient } from "sfx.http";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components
        .register<IPackageManager>({
            name: "package-manager",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: (settings: ISettings, httpsClient: IHttpClient) =>
                import("./package-manager").then((module) => new module.default(settings, httpsClient)),
            deps: ["settings", "http.https-client"]
        });

    return {
        name: "package-manager",
        version: appUtils.getAppVersion()
    };
};

(<IModule>exports).initializeAsync = (moduleManager: IModuleManager): Promise<void> =>
    moduleManager.getComponentAsync("settings")
        .then((settings) => import("./module-load-policy").then((module) => new module.default(settings)))
        .then((policy) => moduleManager.setModuleLoadingPolicy(policy));
