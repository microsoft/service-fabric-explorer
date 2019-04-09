//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptService } from "sfx.prompt";

import * as shell from "donuts.node/shell";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IPromptService>({
        name: "prompt-service",
        version: shell.getAppVersion(),
        singleton: true,
        descriptor: (moduleManager) => import("./prompt").then((module) => new module.PromptService(moduleManager)),
        deps: ["module-manager"]
    });

    return {
        name: "prompt",
        version: shell.getAppVersion()
    };
};
