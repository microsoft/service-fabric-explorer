//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface Resolver {
    (name: string, ...extraArgs: Array<any>): any | Promise<any>;
}

interface IRemotingProxy extends IDisposable {
    readonly id: string;

    requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: Array<any>): Promise<T>;

    setResolver(resolver: Resolver): void;
    getResolver(): Resolver;
}