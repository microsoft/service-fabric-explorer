//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { IPromptService, IPrompt } from "sfx.prompt";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<string>>({
        name: "prompt.connect-cluster",
        version: appUtils.getAppVersion(),
        descriptor: (promptService: IPromptService) =>
            promptService.createAsync(
                {
                    pageUrl: appUtils.resolve("connect-cluster.html"),
                    height: 225
                }),
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.connect-cluster",
        version: appUtils.getAppVersion()
    };
};
