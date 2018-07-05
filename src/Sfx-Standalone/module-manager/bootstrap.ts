//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "../utilities/utils";

import * as mmutils from "./utils";
import * as appUtils from "../utilities/appUtils";
import { Communicator } from "../modules/ipc/communicator";

appUtils.logUnhandledRejection();

(async () => {
    const constructorOptionsArg = appUtils.getCmdArg(mmutils.ConstructorOptionsArgName);

    if (!constructorOptionsArg) {
        throw new Error(`Argument is missing: ${mmutils.ConstructorOptionsArgName}`);
    }

    const constructorOptions = JSON.parse(constructorOptionsArg);
    const moduleManager = await mmutils.createModuleManagerAsync(constructorOptions, Communicator.fromChannel(process));
    appUtils.injectModuleManager(moduleManager);
})();
