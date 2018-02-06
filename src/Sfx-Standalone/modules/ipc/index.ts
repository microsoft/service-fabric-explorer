//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import ElectronCommunicator from "./communicator-electron";
import ElectronProxy from "./proxy-electron";

export function getModuleMetadata(): IModuleInfo {
    return {
        name: "ipc",
        version: "1.0.0",
        components: [
            {
                name: "ipc-communicator-electron",
                version: "1.0.0",
                descriptor: (webContentId, subchannelName) => new ElectronCommunicator(webContentId, subchannelName)
            },
            {
                name: "ipc-proxy-electron",
                version: "1.0.0",
                descriptor: (communicator, autoDipsoseCommunicator) => new ElectronProxy(communicator, autoDipsoseCommunicator)
            }
        ]
    };
}
