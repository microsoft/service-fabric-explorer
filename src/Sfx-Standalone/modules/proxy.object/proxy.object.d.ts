//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.proxy.object" {
    import { IDisposable } from "sfx";
    import { IRoutePattern, ICommunicator } from "sfx.remoting";

    export interface Resolver {
        (proxy: IObjectRemotingProxy, name: string, ...extraArgs: Array<any>): IDisposable | Promise<IDisposable>;
    }

    export interface IObjectRemotingProxy extends IDisposable {
        readonly id: string;
        readonly routePattern: IRoutePattern;
        readonly communicator: ICommunicator;

        requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: Array<any>): T | Promise<T>;

        setResolver(resolver: Resolver): void;
        getResolver(): Resolver;
    }
}

declare module "sfx" {
    import { ICommunicator, IRoutePattern } from "sfx.remoting";
    import { IObjectRemotingProxy } from "sfx.proxy.object";

    export interface IModuleManager {
        getComponentAsync(
            componentIdentity: "remoting.proxy",
            pattern: string | RegExp,
            communicator: ICommunicator,
            ownCommunicator?: boolean): Promise<IObjectRemotingProxy>;
    }
}
