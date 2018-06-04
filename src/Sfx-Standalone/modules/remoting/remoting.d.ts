//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.remoting" {
    import * as common from "sfx";

    export interface Resolver {
        (name: string, ...extraArgs: Array<any>): any | Promise<any>;
    }

    export interface IRemotingProxy extends common.IDisposable {
        readonly id: string;

        requestAsync<T extends common.IDisposable>(identifier: string, ...extraArgs: Array<any>): T | Promise<T>;

        setResolver(resolver: Resolver): void;
        getResolver(): Resolver;
    }
}
