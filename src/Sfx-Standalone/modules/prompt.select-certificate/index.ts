//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx.module-manager";
import { IPromptService } from "sfx.prompt";
import { Certificate } from "electron";

import "../../utilities/utils";
import resolve from "../../utilities/resolve";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "prompt.select-certificate",
        version: electron.app.getVersion(),
        components: [
            {
                name: "prompt.select-certificate",
                version: electron.app.getVersion(),
                descriptor:
                    (promptService: IPromptService,
                        parentWindowId: number,
                        certificates: Array<Certificate>) => {
                        if (!Object.isObject(promptService)) {
                            throw new Error("promptService must be supplied.");
                        }

                        if (!Array.isArray(certificates)) {
                            throw new Error("certificates must be supplied.");
                        }

                        return promptService.createAsync(
                            {
                                parentWindowId: parentWindowId,
                                pageUrl: resolve("select-certificate.html"),
                                height: 640,
                                data: certificates
                            });
                    },
                deps: ["prompt.prompt-service"]
            }
        ]
    };
}
