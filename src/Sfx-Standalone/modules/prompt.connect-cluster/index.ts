//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptService, IPrompt } from "sfx.prompt";

import * as shell from "donuts.node/shell";
import { resolve } from "donuts.node/path";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<string>>({
        name: "connect-cluster",
        version: shell.getAppVersion(),
        descriptor: (promptService: IPromptService) =>
            promptService.createAsync(
                {
                    pageUrl: resolve("connect-cluster.html"),
                    height: 225
                }),
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.connect-cluster",
        namespace: "prompt",
        version: shell.getAppVersion()
    };
};
