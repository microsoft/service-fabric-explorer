//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import bootstrapPromise from "../../module-manager/bootstrap";

import { PromptContext } from "./prompt-context";
import * as appUtils from "../../utilities/appUtils";

(async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    await bootstrapPromise;

    sfxModuleManager.registerComponents([
        {
            name: "prompt.prompt-context",
            version: appUtils.getAppVersion(),
            singleton: true,
            descriptor: () => new PromptContext()
        }
    ]);
})();
