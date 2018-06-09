//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx";

import { PromptService } from "./prompt";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt",
        version: electron.app.getVersion(),
        components: [
            {
                name: "prompt.prompt-service",
                version: electron.app.getVersion(),
                singleton: true,
                descriptor: (moduleManager) => new PromptService(moduleManager),
                deps: ["module-manager"]
            }
        ]
    };
}
