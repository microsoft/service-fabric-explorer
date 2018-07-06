//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as bootstrapPromise from "../../module-manager/bootstrap";

import { PromptContext } from "./prompt-context";
import * as appUtils from "../../utilities/appUtils";

process.once("loaded", async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    console.log(bootstrapPromise);

    await bootstrapPromise;

    console.log(sfxModuleManager);
    console.log("finish waiting.");

    sfxModuleManager.registerComponents([
        {
            name: "prompt.prompt-context",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: () => new PromptContext()
        }
    ]);
});
