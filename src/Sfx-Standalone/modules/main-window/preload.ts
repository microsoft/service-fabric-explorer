//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { electron } from "../../utilities/electron-adapter";

process.argv.push(electron.remote.getCurrentWindow()["rendered.process.args"]);

import { bootstrap } from "../../bootstrap.module-manager";
import * as appUtils from "../../utilities/appUtils";

appUtils.logUnhandledRejection();

process.once("loaded", () => {
    // TODO: Remove global.exports when the node v10 is integrated with electron.
    global["exports"] = exports;

    return bootstrap();
});
