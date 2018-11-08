//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

require("donuts.node-modularity/bootstrap");

import * as appUtils from "../../utilities/appUtils";
import * as modularity from "donuts.node-modularity";

appUtils.logUnhandledRejection();
appUtils.injectModuleManager(modularity.getModuleManager());

process.once("loaded", async () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;
});
