//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { PromptService } from "./prompt-service";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt",
        version: "1.0.0",
        components: [
            {
                name: "prompt-service",
                version: "1.0.0",
                singleton: true,
                descriptor: (moduleManager) => new PromptService(moduleManager),
                deps: ["module-manager"]
            }
        ]
    };
}
