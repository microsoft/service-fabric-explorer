//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IModuleInfo } from "sfx";
import { ICommunicator } from "sfx.ipc";

import { electron } from "../../utilities/electron-adapter";
import { RemotingProxy } from "./proxy";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "remoting",
        version: electron.app.getVersion(),
        components: [
            {
                name: "remoting.proxy",
                version: electron.app.getVersion(),
                descriptor:
                    (communicator: ICommunicator, ownCommunicator?: boolean) => new RemotingProxy(communicator, ownCommunicator)
            }
        ]
    };
}
