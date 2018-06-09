//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx" {
    export interface IDictionary<TValue> {
        [key: string]: TValue;
    }

    export interface IDisposable {
        readonly disposed: boolean;
        dispose(): void | Promise<void>;
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

    /* Module Manager */
    export interface IComponentDescriptor {
        (...deps: Array<any>): any;
    }

    export interface IComponentInfo {
        name: string;
        version?: string;
        descriptor: IComponentDescriptor;
        singleton?: boolean;
        deps?: Array<string>;
    }

    export interface IModuleInfo {
        name: string;
        version: string;
        hostVersion?: string;
        components?: Array<IComponentInfo>;
    }

    export interface HostVersionMismatchEventHandler {
        (moduleInfo: IModuleInfo, currentVersion: string, expectedVersion: string): boolean;
    }

    export interface IModuleManager {
        hostVersion: string;

        newHostAsync(hostName: string): Promise<void>;
        destroyHostAsync(hostName: string): Promise<void>;

        loadModuleDirAsync(dirName: string, hostName?: string): Promise<void>;
        loadModuleAsync(path: string, hostName?: string): Promise<void>;

        registerComponents(componentInfos: Array<IComponentInfo>): void;

        onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler;

        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T>;
        getComponentAsync(componentIdentity: "module-manager"): Promise<IModuleManager>;
    }

    export interface IHandlerConstructor<THandler> {
        (nextHandler: THandler): THandler;
    }

    export interface IHandlerChainBuilder<THandler extends Function> {
        handle(constructor: IHandlerConstructor<THandler>): IHandlerChainBuilder<THandler>;
        build(): THandler;
    }

    global {
        const sfxModuleManager: IModuleManager;
    }
}
