//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModule } from "sfx.module-manager";
import { IPromptService, IPrompt } from "sfx.prompt";
import { ICertificateInfo } from "sfx.cert";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<ICertificateInfo>>({
        name: "prompt.select-certificate",
        version: appUtils.getAppVersion(),
        descriptor:
            (promptService: IPromptService,
                certInfos: Array<ICertificateInfo>) => {
                if (!Object.isObject(promptService)) {
                    throw new Error("promptService must be supplied.");
                }

                return promptService.createAsync(
                    {
                        pageUrl: appUtils.resolve("select-certificate.html"),
                        height: 640,
                        data: certInfos
                    });
            },
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.select-certificate",
        version: appUtils.getAppVersion()
    };
};
