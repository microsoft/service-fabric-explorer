//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.common" {

    export type FunctionType = (...args: Array<any>) => any;

    export interface IDictionary<TValue> {
        [key: string]: TValue;
    }

    export interface IDisposable {
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

    export interface IAsyncHandlerConstructor<THandler extends FunctionType> {
        (nextHandler: THandler): Promise<THandler>;
    }

    export interface IHandlerChainBuilder<THandler extends FunctionType> {
        handleAsync(constructor: IAsyncHandlerConstructor<THandler>): Promise<IHandlerChainBuilder<THandler>>;
        buildAsync(): Promise<THandler>;
    }

    export interface IComponentConfiguration {
        id: string;
        title: string;
        iconUrl?: string;
        viewUrl?: string;
        mainViewUrl?: string;
    }
}
