//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { IPromptService, IPrompt } from "sfx.prompt";
import { ISelectCertificatePromptResults } from "sfx.prompt.select-certificate";
import { Certificate } from "electron";

import * as appUtils from "../../utilities/appUtils";

exports = <IModule>{
    getModuleMetadata: (components) => {
        components.register<IPrompt<ISelectCertificatePromptResults>>({
            name: "prompt.select-certificate",
            version: appUtils.getAppVersion(),
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
                            pageUrl: appUtils.resolve("select-certificate.html"),
                            height: 640,
                            data: certificates
                        });
                },
            deps: ["prompt.prompt-service"]
        });

        return {
            name: "prompt.select-certificate",
            version: appUtils.getAppVersion()
        };
    }
};
