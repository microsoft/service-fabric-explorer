//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.common" {
    export interface IDictionary<TValue> {
        [key: string]: TValue;
    }

    export interface IDisposable {
        readonly disposed: boolean;
        disposeAsync(): Promise<void>;
    }

    export interface IPackageInfo {
        x86?: string;
        x64?: string;
    }

    export interface IVersionInfo {
        version: string;
        description?: string;

        linux?: IPackageInfo | string;
        windows?: IPackageInfo | string;
        macos?: IPackageInfo | string;
    }

    export interface IHandlerConstructor<THandler> {
        (nextHandler: THandler): THandler;
    }

    export interface IHandlerChainBuilder<THandler extends Function> {
        handle(constructor: IHandlerConstructor<THandler>): IHandlerChainBuilder<THandler>;
        build(): THandler;
    }
}
