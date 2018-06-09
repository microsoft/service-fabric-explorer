//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx";
import { IPromptService } from "sfx.prompt";
import { IInputPromptOptions } from "sfx.prompt.input";

import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt.input",
        version: electron.app.getVersion(),
        components: [
            {
                name: "prompt.input",
                version: electron.app.getVersion(),
                descriptor: (promptService: IPromptService, parentWindowId: number, options: IInputPromptOptions) =>
                    promptService.createAsync(
                        {
                            parentWindowId: parentWindowId,
                            pageUrl: resolve("input.html"),
                            height: 225,
                            data: options
                        }),
                deps: ["prompt.prompt-service"]
            }
        ]
    };
}
