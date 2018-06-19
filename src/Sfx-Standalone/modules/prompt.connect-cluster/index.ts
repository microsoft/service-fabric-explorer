//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";

import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt.connect-cluster",
        version: electron.app.getVersion(),
        components: [
            {
                name: "prompt.connect-cluster",
                version: electron.app.getVersion(),
                descriptor: (promptService: IPromptService) =>
                    promptService.createAsync(
                        {
                            pageUrl: resolve("connect-cluster.html"),
                            height: 225
                        }),
                deps: ["prompt.prompt-service"]
            }
        ]
    };
}
