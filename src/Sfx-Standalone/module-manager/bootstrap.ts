//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as mmutils from "./utils";
import * as appUtils from "../utilities/appUtils";
import { Communicator } from "../modules/ipc/communicator";

(async () => {
    const constructorOptionsArg = appUtils.getCmdArg(mmutils.ConstructorOptionsArgName);

    if (!constructorOptionsArg) {
        throw new Error(`Argument is missing: ${mmutils.ConstructorOptionsArgName}`);
    }

    const constructorOptions = JSON.parse(constructorOptionsArg);
    const moduleManager = await mmutils.createModuleManagerAsync(constructorOptions, new Communicator(process));

    global["sfxModuleManager"] = moduleManager;
})();
