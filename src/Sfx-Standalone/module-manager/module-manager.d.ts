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

    type FunctionType = (...args: Array<any>) => any;

    type NonPromiseReturnType<T extends FunctionType> = ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>;

    type FunctionComponent<T extends FunctionType> = (...args: Array<any>) => Promise<Component<NonPromiseReturnType<T>>>;

    type SerializableType = String | Number | Boolean | Date | Buffer;

    interface SerializableArray<TItem extends s<TItem>> extends Array<TItem> {

    }

    type SerializableObject<T> = {
        [Property in keyof T]:
        T[Property] extends s<T[Property]> ? T[Property] :
        never;
    };

    type s<T> =
        T extends SerializableType ? T :
        T extends SerializableArray<infer TItem> ? T :
        T extends SerializableObject<T> ? T : never;

    interface ArrayComponent<TItem>
        extends Array<Component<TItem>> {
    }

    type ObjectComponent<T> = {
        [Property in keyof T]:
        T[Property] extends FunctionType ? FunctionComponent<T[Property]> :
        T[Property] extends Promise<infer R> ? Promise<Component<R>> :
        Promise<Component<T[Property]>>;
    };

    export type Component<T> =
        T extends String ? T :
        T extends Number ? T :
        T extends Boolean ? T :
        T extends Date ? T :
        T extends Buffer ? T :
        T extends FunctionType ? FunctionComponent<T> :
        T extends Array<infer TItem> ? (TItem extends SerializableType ? Array<TItem> : ArrayComponent<TItem>) :
        T extends Object ? (T extends SerializableObject<T> ? T : ObjectComponent<T>) :
        never;

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
