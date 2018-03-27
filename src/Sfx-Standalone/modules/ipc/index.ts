//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog } from "../../@types/log";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: "1.0.0",
        components: [
            {
                name: "ipc-communicator-electron",
                version: "1.0.0",
                descriptor: (log: ILog, webContentId: number, subchannelName: string) => new ElectronCommunicator(log, webContentId, subchannelName),
                deps: ["log"]
            },
            {
                name: "ipc-proxy-electron",
                version: "1.0.0",
                descriptor: (log: ILog, communicator: ICommunicator, autoDipsoseCommunicator: boolean) => new ElectronProxy(log, communicator, autoDipsoseCommunicator),
                deps: ["log"]
            }
        ]
    };
}
