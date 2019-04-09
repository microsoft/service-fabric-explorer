//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHttpClient } from "sfx.http";
import { IUpdateSettings } from "./update";
import { IUpdateService } from "sfx.update";
import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components): Donuts.Modularity.IModuleInfo => {
    components.register<IUpdateService>({
        name: "service",
        version: shell.getAppVersion(),
        singleton: true,
        descriptor:
            async (log: Donuts.Logging.ILog, settings: Donuts.Settings.ISettings, httpsClient: IHttpClient) =>
                settings.getAsync<IUpdateSettings>("update")
                    .then((updateSettings) => import("./update").then((module) => new module.default(log, updateSettings, httpsClient))),
        deps: ["logging.default", "settings.default", "http.http-client"]
    });

    return {
        name: "update",
        version: shell.getAppVersion()
    };
};
