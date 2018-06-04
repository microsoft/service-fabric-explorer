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
        version: string;
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

    export interface DepVersionMismatchEventHandler {
        (componentIdentity: string, depIdentity: string): boolean;
    }

    export interface IModuleManager {
        hostVersion: string;

        loadModules(folderPath: string, callback?: (error: Array<Error>) => void): IDictionary<Array<Error>>;
        loadModule(path: string, callback?: (error: Array<Error>) => void): Array<Error>;

        registerComponents(componentInfos: Array<IComponentInfo>): Array<Error>;

        resolveComponentIdentity(componentIdentity: string): string;
        getComponent(componentIdentity: "module-manager"): IModuleManager;
        getComponent<T>(componentIdentity: string, ...extraArgs: Array<any>): T;

        onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler;
        onDepVersionMismatch(callback?: DepVersionMismatchEventHandler): void | DepVersionMismatchEventHandler;
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
