//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.module-manager" {
    import { ICommunicator } from "sfx.remoting";

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

    export type LoadingMode = "RefFromParent" | "Always";

    export interface IModuleInfo {
        name: string;
        version: string;
        hostVersion?: string;
        /**
         * Indicates the loading mode of the module. Default: RefFromParent.
         */
        loadingMode?: LoadingMode;
        components?: Array<IComponentInfo>;
    }

    export interface IModuleLoadingInfo {
        location: string;
        name: string;
        version: string;
        hostVersion?: string;
        loadingMode?: LoadingMode;
    }

    export interface IModule {
        getModuleMetadata?(): IModuleInfo;
        initialize?(moduleManager: IModuleManager): void;
    }

    export interface HostVersionMismatchEventHandler {
        (moduleInfo: IModuleInfo, currentVersion: string, expectedVersion: string): boolean;
    }

    export interface IModuleManager {
        readonly hostVersion: string;
        readonly loadedModules: Array<IModuleLoadingInfo>;

        newHostAsync(hostName: string, hostCommunicator?: ICommunicator): Promise<void>;
        destroyHostAsync(hostName: string): Promise<void>;

        loadModuleDirAsync(dirName: string, hostName?: string): Promise<void>;
        loadModuleAsync(path: string, hostName?: string): Promise<void>;

        registerComponents(componentInfos: Array<IComponentInfo>): void;

        onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler;

        getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T>;
        getComponentAsync(componentIdentity: "module-manager"): Promise<IModuleManager>;
    }
}
