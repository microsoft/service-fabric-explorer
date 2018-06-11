//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx" {
    import { ChildProcess } from "child_process";
    import { Socket } from "net";
    import { ICommunicator } from "sfx.remoting";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "ipc.communicator-node",
            channel: NodeJS.Process | ChildProcess | Socket,
            id?: string): Promise<ICommunicator>;
    }
}
