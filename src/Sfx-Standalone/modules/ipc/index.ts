//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChannelType, ICommunicatorConstructorOptions } from "sfx.ipc";
import { IModuleInfo, IModule } from "sfx.module-manager";
import { ICommunicator } from "sfx.remoting";

import * as appUtils from "../../utilities/appUtils";

(<IModule>exports).getModuleMetadata = (components): IModuleInfo => {
    components.register<any>({
        name: "ipc.communicator",
        version: appUtils.getAppVersion(),
        descriptor: async (channel: ChannelType, options?: ICommunicatorConstructorOptions): Promise<ICommunicator> =>
            import("./communicator").then((module) => module.Communicator.fromChannel(channel, options))
    });

    return {
        name: "ipc",
        version: appUtils.getAppVersion(),
        loadingMode: "Always"
    };
};
