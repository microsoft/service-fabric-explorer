//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";

import { PromptService } from "./prompt";
import * as appUtils from "../../utilities/appUtils";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt",
        version: appUtils.getAppVersion(),
        components: [
            {
                name: "prompt.prompt-service",
                version: appUtils.getAppVersion(),
                singleton: true,
                descriptor: (moduleManager) => new PromptService(moduleManager),
                deps: ["module-manager"]
            }
        ]
    };
}
