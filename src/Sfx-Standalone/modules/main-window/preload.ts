//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as electron from "electron";

process.argv.push(electron.remote.getCurrentWindow()["rendered.process.args"]);

import { bootstrap } from "../../bootstrap.module-manager";
import * as appUtils from "../../utilities/appUtils";

appUtils.logUnhandledRejection();

process.once("loaded", () => {
    return bootstrap();
});
