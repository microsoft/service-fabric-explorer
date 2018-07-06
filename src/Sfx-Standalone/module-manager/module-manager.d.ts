//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import { ICommunicator } from "sfx.remoting";

    export interface IModuleManagerConstructorOptions {
        hostVersion: string;
        initialModules: Array<IModuleLoadingConfig>;
    }

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

    export type LoadingMode = "RefFromParent" | "Always";

    export interface IModuleBasicInfo {
        name: string;
        version: string;
        hostVersion?: string;
        /**
         * Indicates the loading mode of the module. Default: RefFromParent.
         */
        loadingMode?: LoadingMode;
    }

    export interface IModuleInfo extends IModuleBasicInfo {
        components?: Array<IComponentInfo>;
    }

    export interface IModuleLoadingConfig extends IModuleBasicInfo {
        location: string;
        loadingMode: LoadingMode;
    }

    export interface IModuleLoadingPolicy {
        shouldLoad(moduleManager: IModuleManager, moduleName: string): boolean;
        shouldLoad(moduleManager: IModuleManager, moduleInfo: IModuleInfo): boolean;
    }

    export interface IModule {
        getModuleMetadata?(): IModuleInfo;
        initializeAsync?(moduleManager: IModuleManager): Promise<void>;
    }

    export interface HostVersionMismatchEventHandler {
        (moduleInfo: IModuleInfo, currentVersion: string, expectedVersion: string): boolean;
    }

    export interface IModuleManager {
        readonly hostVersion: string;
        readonly loadedModules: Array<IModuleLoadingConfig>;

        generateConstructorOptions(): IModuleManagerConstructorOptions;

        newHostAsync(hostName: string, hostCommunicator?: ICommunicator): Promise<void>;
        destroyHostAsync(hostName: string): Promise<void>;

        loadModuleDirAsync(dirName: string, hostName?: string): Promise<void>;
        loadModuleAsync(path: string, hostName?: string): Promise<void>;

        setModuleLoadingPolicy(policy: IModuleLoadingPolicy): void;

        registerComponents(componentInfos: Array<IComponentInfo>): void;

        onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler;

        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T>;
        getComponentAsync(componentIdentity: "module-manager"): Promise<IModuleManager>;
    }
}
