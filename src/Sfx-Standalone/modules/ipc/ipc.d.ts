//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
declare module "sfx.ipc" {
    import { ChildProcess } from "child_process";
    import { Socket } from "net";

    export type ChannelType = NodeJS.Process | ChildProcess | Socket | Electron.IpcRenderer | Electron.WebContents;
}

declare module "sfx.module-manager" {
    import { ChannelType } from "sfx.ipc";
    import { ICommunicator } from "sfx.remoting";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "ipc.communicator",
            channel: ChannelType,
            id?: string): Promise<ICommunicator>;
    }
}
