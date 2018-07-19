//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";

import { PromptService } from "./prompt";
import * as appUtils from "../../utilities/appUtils";

exports = <IModule>{
    getModuleMetadata: (components) => {
        components.register<IPromptService>({
            name: "prompt.prompt-service",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: async (moduleManager) => new PromptService(moduleManager),
            deps: ["module-manager"]
        });

        return {
            name: "prompt",
            version: appUtils.getAppVersion()
        };
    }
};
