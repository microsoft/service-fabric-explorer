//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptService, IPrompt } from "sfx.prompt";
import { ICertificateInfo } from "sfx.cert";

import * as shell from "donuts.node/shell";
import { resolve } from "donuts.node/path";
import * as utils from "donuts.node/utils";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<ICertificateInfo>>({
        name: "select-certificate",
        version: shell.getAppVersion(),
        descriptor:
            (promptService: IPromptService,
                certInfos: Array<ICertificateInfo>) => {
                if (!utils.isObject(promptService)) {
                    throw new Error("promptService must be supplied.");
                }

                return promptService.createAsync(
                    {
                        pageUrl: resolve("select-certificate.html"),
                        height: 640,
                        data: certInfos
                    });
            },
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.select-certificate",
        namespace: "prompt",
        version: shell.getAppVersion()
    };
};
