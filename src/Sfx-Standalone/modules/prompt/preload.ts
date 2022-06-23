//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { PromptContext } from "./prompt-context";
import * as shell from "donuts.node/shell";
import * as appUtils from "../../utilities/appUtils";
import { bootstrap } from "../../bootstrap.module-manager";

(async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    appUtils.logUnhandledRejection();

    const moduleManager = await bootstrap();

    moduleManager.registerComponentsAsync("prompt",
        [{
            name: "prompt-context",
            version: shell.getAppVersion(),
            singleton: true,
            descriptor: async () => new PromptContext(),
            type: "local"
        }]);
})();