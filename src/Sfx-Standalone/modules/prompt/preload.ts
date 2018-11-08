//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

require("donuts.node-modularity/bootstrap");

import { PromptContext } from "./prompt-context";
import * as shell from "donuts.node/shell";
import * as appUtils from "../../utilities/appUtils";
import * as modularity from "donuts.node-modularity";

(async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    appUtils.logUnhandledRejection();
    appUtils.injectModuleManager(modularity.getModuleManager());

    sfxModuleManager.registerComponentsAsync("prompt",
        [{
            name: "prompt-context",
            version: shell.getAppVersion(),
            singleton: true,
            descriptor: async () => new PromptContext(),
            type: "local"
        }]);
})();
