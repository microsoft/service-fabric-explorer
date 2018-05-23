//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ChildProcess } from "child_process";
import { Socket } from "net";

import { ILog } from "../../@types/log";
import * as utilities from "./utilities";
import { NodeCommunicator } from "./communicator-node";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: "1.0.0",
        components: [
            {
                name: "ipc-communicator-node",
                version: "1.0.0",
                deps: ["log"],
                descriptor: (log: ILog, channel: NodeJS.Process | ChildProcess | Socket, id?: string) => new NodeCommunicator(channel, id)
            },
            {
                name: "ipc-communicator-utilities",
                version: "1.0.0",
                deps: [],
                descriptor: () => utilities
            }
        ]
    };
}
