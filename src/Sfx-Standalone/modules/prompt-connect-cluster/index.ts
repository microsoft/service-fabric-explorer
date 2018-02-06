//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import resolve from "../../utilities/resolve";
import { IPromptService } from "../../@types/prompt";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: "1.0.0",
        components: [
            {
                name: "prompt-connect-cluster",
                version: "1.0.0",
                descriptor: (promptService: IPromptService, promptCallback: (error: any, targetClusterUrl: string) => void) =>
                    promptService.open(
                        {
                            pageUrl: resolve("connect-cluster.html"),
                            height: 225
                        },
                        promptCallback),
                deps: ["prompt-service"]
            }
        ]
    };
}
