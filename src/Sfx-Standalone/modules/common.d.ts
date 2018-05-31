//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface IDictionary<Tvalue> {
    [key: string]: Tvalue;
}

interface IDisposable {
    readonly disposed: boolean;
    dispose(): void | Promise<void>;
}

interface IPackageInfo {
    x86?: string;
    x64?: string;
}

interface IVersionInfo {
    version: string;
    description?: string;

    linux?: IPackageInfo | string;
    windows?: IPackageInfo | string;
    macos?: IPackageInfo | string;
}

/* Module Manager */
interface IComponentDescriptor {
    (...deps: Array<any>): any;
}

interface IComponentInfo {
    name: string;
    version: string;
    descriptor: IComponentDescriptor;
    singleton?: boolean;
    deps?: Array<string>;
}

interface IModuleInfo {
    name: string;
    version: string;
    hostVersion?: string;
    components?: Array<IComponentInfo>;
}

interface HostVersionMismatchEventHandler {
    (moduleInfo: IModuleInfo, currentVersion: string, expectedVersion: string): boolean;
}

interface DepVersionMismatchEventHandler {
    (componentIdentity: string, depIdentity: string): boolean;
}

interface IModuleManager {
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

interface IHandlerConstructor<THandler> {
    (nextHandler: THandler): THandler;
}

interface IHandlerChainBuilder<THandler extends Function> {
    handle(constructor: IHandlerConstructor<THandler>): IHandlerChainBuilder<THandler>;
    build(): THandler;
}
