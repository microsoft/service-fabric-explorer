//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import resolve from "../../utilities/resolve";
import { IPromptService, IInputPromptOptions } from "../../@types/prompt";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: "1.0.0",
        components: [
            {
                name: "prompt-input",
                version: "1.0.0",
                descriptor: (promptService: IPromptService, parentWindowId: number, options: IInputPromptOptions, promptCallback: (error: any, input: string) => void) =>
                    promptService.open(
                        {
                            parentWindowId: parentWindowId,
                            pageUrl: resolve("input.html"),
                            height: 225,
                            data: options
                        },
                        promptCallback),
                deps: ["prompt-service"]
            }
        ]
    };
}
