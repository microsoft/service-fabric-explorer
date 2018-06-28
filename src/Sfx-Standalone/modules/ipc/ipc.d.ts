//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
declare module "sfx.ipc" {
    import { ChildProcess } from "child_process";
    import { Socket } from "net";

    export type ChannelType = NodeJS.Process | ChildProcess | Socket | Electron.IpcRenderer | Electron.WebContents;

    export interface ICommunicatorConstructorOptions {
        id?: string;

        /**
         * Timeout if the remoting operation takes too long. Default: 5 min.
         */
        timeout?: number;
    }
}

declare module "sfx.module-manager" {
    import { ChannelType, ICommunicatorConstructorOptions } from "sfx.ipc";
    import { ICommunicator } from "sfx.remoting";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "ipc.communicator",
            channel: ChannelType,
            options?: ICommunicatorConstructorOptions): Promise<ICommunicator>;
    }
}
