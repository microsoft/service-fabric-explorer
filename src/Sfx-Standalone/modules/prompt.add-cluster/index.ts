//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IPromptService, IPrompt } from "sfx.prompt";
import { ICertificateInfo } from "sfx.cert";

import * as shell from "donuts.node/shell";
import * as utils from "donuts.node/utils";

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components) => {
    components.register<IPrompt<ICertificateInfo>>({
        name: "add-cluster",
        version: shell.getAppVersion(),
        descriptor:
            (promptService: IPromptService, data) => {
                if (!utils.isObject(promptService)) {
                    throw new Error("promptService must be supplied.");
                }

                return promptService.createAsync(
                    {
                        pageUrl: (__dirname + "/add-cluster.html"),
                        height: 640,
                        data
                    });
            },
        deps: ["prompt.prompt-service"]
    });

    return {
        name: "prompt.add-cluster",
        namespace: "prompt",
        version: shell.getAppVersion()
    };
};