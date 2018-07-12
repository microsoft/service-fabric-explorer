//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import { IDisposable } from "sfx.common";
    import { ICommunicator } from "sfx.remoting";

    export interface IModuleManagerConstructorOptions {
        hostVersion: string;
        initialModules?: Array<IModuleLoadingConfig>;
    }

    export interface IComponentDescriptor<T> {
        (...args: Array<any>): Promise<T>;
    }

    export interface IComponentInfo<T> {
        name: string;
        version?: string;
        descriptor: IComponentDescriptor<T>;
        singleton?: boolean;
        deps?: Array<string>;
    }

    export type LoadingMode = "RefFromParent" | "Always";

    export interface IModuleInfo {
        name: string;
        version: string;
        hostVersion?: string;
        /**
         * Indicates the loading mode of the module. Default: RefFromParent.
         */
        loadingMode?: LoadingMode;
    }

    export interface IModuleLoadingConfig extends IModuleInfo {
        location: string;
        loadingMode: LoadingMode;
    }

    export interface IModuleLoadingPolicy {
        shouldLoad(moduleManager: IModuleManager, moduleName: string): boolean;
        shouldLoad(moduleManager: IModuleManager, moduleInfo: IModuleInfo): boolean;
    }

    export interface IModule {
        getModuleMetadata?(components: IComponentCollection): IModuleInfo;
        initializeAsync?(moduleManager: IModuleManager): Promise<void>;
    }

    export interface HostVersionMismatchEventHandler {
        (moduleInfo: IModuleInfo, currentVersion: string, expectedVersion: string): boolean;
    }

    type IgnorePromiseReturnType<TFunc extends Function> =
        TFunc extends (...args: any[]) => Promise<infer IR> ? IR :
        TFunc extends (...args: any[]) => infer TR ? TR : never;

    export type Component<T> =
        T extends Function ? FunctionComponent<T> :
        T extends Object ? ObjectComponent<T> : never;

    export type FunctionComponent<T extends Function> = (...args: Array<any>) => Promise<Component<IgnorePromiseReturnType<T>>>;

    export type ObjectComponent<T> = {
        [Property in keyof T]:
        T[Property] extends Function ? (...args: Array<any>) => Promise<Component<IgnorePromiseReturnType<T[Property]>>> :
        T[Property] extends Promise<infer IR> ? Promise<Component<IR>> :
        T[Property] extends Object ? Component<T[Property]> : Promise<T[Property]>;
    };

    export interface IComponentCollection {
        register<T extends TComponent, TComponent = Component<T>>(componentInfo: IComponentInfo<T>): IComponentCollection;
    }

    export interface IModuleManager extends IComponentCollection {
        readonly hostVersion: string;
        readonly loadedModules: Array<IModuleLoadingConfig>;

        generateConstructorOptions(): IModuleManagerConstructorOptions;

        newHostAsync(hostName: string, hostCommunicator?: ICommunicator): Promise<void>;
        destroyHostAsync(hostName: string): Promise<void>;

        loadModuleDirAsync(dirName: string, hostName?: string): Promise<void>;
        loadModuleAsync(path: string, hostName?: string): Promise<void>;

        setModuleLoadingPolicy(policy: IModuleLoadingPolicy): void;

        onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler;

        getComponentAsync<T extends TComponent, TComponent = Component<T>>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T & Partial<IDisposable>>;
    }
}
