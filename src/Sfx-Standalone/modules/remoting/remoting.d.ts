//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.remoting" {
    import { IDisposable } from "sfx";

    export interface Resolver {
        (name: string, ...extraArgs: Array<any>): IDisposable | Promise<IDisposable>;
    }

    export interface IRemotingProxy extends IDisposable {
        readonly id: string;

        requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: Array<any>): T | Promise<T>;

        setResolver(resolver: Resolver): void;
        getResolver(): Resolver;
    }
}

declare module "sfx" {
    import { ICommunicator } from "sfx.ipc";
    import { IRemotingProxy } from "sfx.remoting";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "remoting.proxy",
            communicator: ICommunicator,
            ownCommunicator?: boolean): Promise<IRemotingProxy>;
    }
}
