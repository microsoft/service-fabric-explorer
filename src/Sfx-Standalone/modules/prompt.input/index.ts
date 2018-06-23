//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";
import { IInputPromptOptions } from "sfx.prompt.input";

import * as appUtils from "../../utilities/appUtils";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt.input",
        version: appUtils.getAppVersion(),
        components: [
            {
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
            }
        ]
    };
}
