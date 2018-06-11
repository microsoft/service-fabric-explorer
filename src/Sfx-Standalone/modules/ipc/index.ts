//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChannelType } from "sfx.ipc";
import { IModuleInfo } from "sfx.module-manager";
import { ILog } from "sfx.logging";

import { Communicator } from "./communicator";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: electron.app.getVersion(),
        loadingMode: "Always",
        components: [
            {
                name: "ipc.communicator",
                version: electron.app.getVersion(),
                deps: ["logging"],
                descriptor: (log: ILog, channel: ChannelType, id?: string) => new Communicator(channel, id)
            }
        ]
    };
}
