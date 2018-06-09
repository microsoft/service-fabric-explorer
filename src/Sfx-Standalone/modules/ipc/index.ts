//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx";
import { ILog } from "sfx.logging";

import { ChildProcess } from "child_process";
import { Socket } from "net";

import * as utilities from "./utilities";
import { NodeCommunicator } from "./communicator.node";
import { electron } from "../../utilities/electron-adapter";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: electron.app.getVersion(),
        components: [
            {
                name: "ipc.communicator-node",
                version: electron.app.getVersion(),
                deps: ["logging"],
                descriptor: (log: ILog, channel: NodeJS.Process | ChildProcess | Socket, id?: string) => new NodeCommunicator(channel, id)
            },
            {
                name: "ipc.communicator-utilities",
                version: electron.app.getVersion(),
                deps: [],
                descriptor: () => utilities
            }
        ]
    };
}
