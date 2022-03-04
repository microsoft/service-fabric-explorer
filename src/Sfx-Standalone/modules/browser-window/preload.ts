//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { bootstrap } from "../../bootstrap.module-manager";
import * as appUtils from "../../utilities/appUtils";
import * as electron from "electron";

appUtils.logUnhandledRejection();

process.once("loaded", () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    return bootstrap();
});
