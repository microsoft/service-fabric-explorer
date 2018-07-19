//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { IPromptService, IPrompt } from "sfx.prompt";
import { IInputPromptOptions } from "sfx.prompt.input";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<string>>({
        name: "prompt.input",
        version: appUtils.getAppVersion(),
        descriptor:
            (promptService: IPromptService,
                parentWindowId: number,
                options: IInputPromptOptions) =>
                promptService.createAsync(
                    {
                        parentWindowId: parentWindowId,
                        pageUrl: appUtils.resolve("input.html"),
                        height: 225,
                        data: options
                    }),
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.input",
        version: appUtils.getAppVersion()
    };
};
