//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChannelType, ICommunicatorConstructorOptions } from "sfx.ipc";
import { IModuleInfo, IModule } from "sfx.module-manager";
import { ICommunicator } from "sfx.remoting";

import { Communicator } from "./communicator";
import * as appUtils from "../../utilities/appUtils";

exports = <IModule>{
    getModuleMetadata: (components): IModuleInfo => {
        components.register({
            name: "ipc.communicator",
            version: appUtils.getAppVersion(),
            descriptor: async (channel: ChannelType, options?: ICommunicatorConstructorOptions): Promise<ICommunicator> =>
                Communicator.fromChannel(channel, options)
        });

        return {
            name: "ipc",
            version: appUtils.getAppVersion(),
            loadingMode: "Always"
        };
    }
};
