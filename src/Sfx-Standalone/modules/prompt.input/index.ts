//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptService, IPrompt } from "sfx.prompt";
import { IInputPromptOptions } from "sfx.prompt.input";

import * as shell from "donuts.node/shell";
import { resolve } from "donuts.node/path";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<string>>({
        name: "input",
        version: shell.getAppVersion(),
        descriptor:
            (promptService: IPromptService,
                parentWindowId: number,
                options: IInputPromptOptions) =>
                promptService.createAsync(
                    {
                        parentWindowId: parentWindowId,
                        pageUrl: resolve("input.html"),
                        height: 225,
                        data: options
                    }),
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.input",
        namespace: "prompt",
        version: shell.getAppVersion()
    };
};
