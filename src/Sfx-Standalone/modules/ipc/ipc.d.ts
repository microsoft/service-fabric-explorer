//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.ipc" {
    import * as common from "sfx";

    export interface RequestHandler {
        (communicator: ICommunicator, path: string, content: any): any | Promise<any>;
    }

    export interface ICommunicator extends common.IDisposable {
        readonly id: string;

        map(pattern: string | RegExp, handler: RequestHandler): void;
        unmap(pattern: string | RegExp): RequestHandler;

        sendAsync<TRequest, TResponse>(path: string, content: TRequest): Promise<TResponse>;
    }

    export interface IIpcUtilities {
        isCommunicator(communicator: any): communicator is ICommunicator;
    }
}

declare module "sfx" {
    import { ICommunicator, IIpcUtilities } from "sfx.ipc";
    import { ChildProcess } from "child_process";
    import { Socket } from "net";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "ipc.communicator-node",
            channel: NodeJS.Process | ChildProcess | Socket,
            id?: string): Promise<ICommunicator>;

        getComponentAsync(componentIdentity: "ipc.communicator-utilities"): Promise<IIpcUtilities>;
    }
}
