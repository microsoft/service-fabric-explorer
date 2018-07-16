//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDisposable } from "sfx.common";
import {
    IModule,
    IModuleManagerConstructorOptions,
    IModuleManager,
    IComponentInfo,
    HostVersionMismatchEventHandler,
    IComponentDescriptor,
    IModuleLoadingConfig,
    IModuleLoadingPolicy,
    Component,
    IComponentCollection
} from "sfx.module-manager";

import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { IObjectRemotingProxy, Resolver } from "sfx.proxy.object";
import { IDiDescriptor } from "../utilities/di";

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import * as semver from "semver";

import * as utils from "../utilities/utils";
import * as di from "../utilities/di";
import * as diExt from "../utilities/di.ext";
import { Communicator } from "../modules/ipc/communicator";
import { ObjectRemotingProxy } from "../modules/proxy.object/proxy.object";
import StringPattern from "../modules/remoting/pattern/string";
import * as appUtils from "../utilities/appUtils";
import DefaultModuleLoadingPolicy from "./default-module-loading-policy";
import ComponentCollection from "./ComponentCollection";

const t: Component<number> = 10;
console.log(t);

export enum ModuleManagerAction {
    loadModuleAsync = "loadModuleAsync",
    loadModuleDirAsync = "loadModuleDirAsync",

    requestConstructorOptions = "requestConstructorOptions"
}

interface IHostRecord {
    process: child_process.ChildProcess;
    proxy: IObjectRemotingProxy;
    communicator: ICommunicator;
}

interface IModuleManagerMessage {
    action: ModuleManagerAction;
    content: any;
}

interface ILoadModuleAsyncMessage extends IModuleManagerMessage {
    action: ModuleManagerAction.loadModuleAsync;
    content: string;
}

interface ILoadModuleDirAsyncMessage extends IModuleManagerMessage {
    action: ModuleManagerAction.loadModuleDirAsync;
    content: string;
}

function createDedicationDiDescriptor(
    moduleManager: IModuleManager,
    descriptor: IComponentDescriptor<any>,
    injects: Array<string>)
    : IDiDescriptor {
    if (!Function.isFunction(descriptor)) {
        throw new Error("descriptor must be a function.");
    }

    if (Array.isNullUndefinedOrEmpty(injects)) {
        injects = undefined;
    } else if (!Array.isArray(injects)) {
        throw new Error("inject must be an array of string.");
    } else {
        for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
            const inject = injects[injectIndex];

            if (String.isEmptyOrWhitespace(inject)) {
                injects[injectIndex] = undefined;
            } else if (!String.isString(inject)) {
                throw new Error("Inject identity must be a string.");
            }
        }
    }

    return async (container, ...extraArgs) => {
        const args: Array<any> = [];

        if (injects !== undefined) {
            for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
                const inject = injects[injectIndex];

                if (inject !== undefined) {
                    const arg = await moduleManager.getComponentAsync(inject);

                    if (arg === undefined) {
                        throw new Error(`Required inject, "${inject}", is not available in the module manager.`);
                    }

                    args.push(arg);
                } else {
                    args.push(null);
                }
            }
        }

        if (Array.isArray(extraArgs) && extraArgs.length > 0) {
            for (let extraArgIndex = 0; extraArgIndex < extraArgs.length; extraArgIndex++) {
                args.push(extraArgs[extraArgIndex]);
            }
        }

        return descriptor(...args);
    };
}

function createLazySingletonDiDescriptor(
    moduleManager: IModuleManager,
    descriptor: IComponentDescriptor<any>,
    injects: Array<string>)
    : IDiDescriptor {
    const dedicationDescriptor = createDedicationDiDescriptor(moduleManager, descriptor, injects);
    let singleton: any = undefined;

    return (container, ...extraArgs) => {
        if (singleton === undefined) {
            singleton = dedicationDescriptor(container, ...extraArgs);
            descriptor = undefined;
        }

        return singleton;
    };
}

export namespace Patterns {
    export const ModuleManager: IRoutePattern = new StringPattern("/module-manager");
    export const ObjectProxy: IRoutePattern = new StringPattern("/module-manager/object-proxy");
}

export class ModuleManager implements IModuleManager {
    public static readonly ConstructorOptionsCmdArgName = "module-manager-constructor-options";

    private readonly _hostVersion: string;

    private hostVersionMismatchHandler: HostVersionMismatchEventHandler;

    private children: Array<IHostRecord>;

    private parentProxy: IObjectRemotingProxy;

    private container: di.IDiContainer;

    private moduleLoadingInfos: Array<IModuleLoadingConfig>;

    private moduleLoadingPolicy: IModuleLoadingPolicy;

    public get hostVersion(): string {
        return this._hostVersion;
    }

    public get loadedModules(): Array<IModuleLoadingConfig> {
        return this.moduleLoadingInfos.slice();
    }

    constructor(
        hostVersion: string,
        parentCommunicator?: ICommunicator) {
        if (!semver.valid(hostVersion)) {
            throw new Error(`Invalid hostVersion "${hostVersion}".`);
        }

        this._hostVersion = hostVersion;
        this.moduleLoadingInfos = [];
        this.moduleLoadingPolicy = new DefaultModuleLoadingPolicy();
        this.container = new di.DiContainer();

        if (parentCommunicator) {
            this.parentProxy = ObjectRemotingProxy.create(Patterns.ObjectProxy, parentCommunicator, true);
            this.parentProxy.setResolver(this.onProxyResolvingAsync);
            parentCommunicator.map(Patterns.ModuleManager, this.onModuleManagerMessageAsync);
        }

        this.container.set("module-manager", diExt.singleton(this));
    }

    public async newHostAsync(hostName: string, hostCommunicator?: ICommunicator): Promise<void> {
        if (String.isEmptyOrWhitespace(hostName)) {
            throw new Error("hostName cannot be null/undefined/empty.");
        }

        if (!this.children) {
            this.children = [];
        }

        if (0 <= this.children.findIndex((child) => child.proxy.id === hostName)) {
            throw new Error(`hostName, "${hostName}", already exists.`);
        }

        let proxy: IObjectRemotingProxy;
        let childProcess: child_process.ChildProcess;

        if (!hostCommunicator) {
            childProcess =
                appUtils.fork(
                    appUtils.local("./bootstrap.js"),
                    [appUtils.toCmdArg(ModuleManager.ConstructorOptionsCmdArgName, JSON.stringify(this.generateConstructorOptions()))]);
            hostCommunicator = Communicator.fromChannel(childProcess, { id: hostName });
            proxy = await ObjectRemotingProxy.create(Patterns.ObjectProxy, hostCommunicator, true, hostName);
        } else {
            proxy = await ObjectRemotingProxy.create(Patterns.ObjectProxy, hostCommunicator, false, hostName);
        }

        proxy.setResolver(this.onProxyResolvingAsync);

        this.children.push({
            process: childProcess,
            proxy: proxy,
            communicator: hostCommunicator
        });
    }

    public async destroyHostAsync(hostName: string): Promise<void> {
        if (String.isEmptyOrWhitespace(hostName)) {
            throw new Error("hostName cannot be null/undefined/empty.");
        }

        if (!this.children) {
            return;
        }

        const childIndex = this.children.findIndex((child) => child.proxy.id === hostName);

        if (childIndex < 0) {
            return;
        }

        const child = this.children[childIndex];

        await child.proxy.disposeAsync();

        if (child.process) {
            child.process.kill();
        }

        this.children.splice(childIndex, 1);

        child.communicator = undefined;
        child.process = undefined;
        child.proxy = undefined;
    }

    public async loadModuleDirAsync(dirName: string, hostName?: string, respectLoadingMode?: boolean): Promise<void> {
        if (!fs.existsSync(dirName)) {
            throw new Error(`Directory "${dirName}" doesn't exist.`);
        }

        const dirStat = fs.statSync(dirName);

        if (!dirStat.isDirectory()) {
            throw new Error(`Path "${dirName}" is not a directory.`);
        }

        if (!utils.isNullOrUndefined(hostName) && !String.isEmptyOrWhitespace(hostName)) {
            const child = await this.obtainChildAsync(hostName);

            await child.communicator.sendAsync<ILoadModuleDirAsyncMessage, void>(
                Patterns.ModuleManager.getRaw(),
                {
                    action: ModuleManagerAction.loadModuleDirAsync,
                    content: dirName
                });
        } else {
            const loadedModules: Array<IModule> = [];

            // Load modules.
            for (const subName of fs.readdirSync(dirName)) {
                const modulePath = path.join(dirName, subName);
                const moduleStat = fs.statSync(modulePath);

                if (moduleStat.isFile() && path.extname(modulePath) !== ".js") {
                    continue;
                }

                const loadedModule = this.loadModule(modulePath, respectLoadingMode);

                if (!loadedModule) {
                    continue;
                }

                loadedModules.push(loadedModule);
            }

            // Initialize modules.
            for (const module of loadedModules) {
                await this.initializeModuleAsync(module);
            }
        }
    }

    public setModuleLoadingPolicy(policy: IModuleLoadingPolicy): void {
        if (utils.isNullOrUndefined(policy)) {
            this.moduleLoadingPolicy = new DefaultModuleLoadingPolicy();
        }

        if (!Function.isFunction(policy.shouldLoad)) {
            throw new Error("policy must implement shouldLoad() function.");
        }

        this.moduleLoadingPolicy = policy;
    }

    public async loadModuleAsync(path: string, hostName?: string, respectLoadingMode?: boolean): Promise<void> {
        if (!fs.existsSync(path)) {
            throw new Error(`path "${path}" doesn't exist.`);
        }

        if (!utils.isNullOrUndefined(hostName) && !String.isEmptyOrWhitespace(hostName)) {
            const child = await this.obtainChildAsync(hostName);

            await child.communicator.sendAsync<ILoadModuleAsyncMessage, void>(
                Patterns.ModuleManager.getRaw(),
                {
                    action: ModuleManagerAction.loadModuleAsync,
                    content: path
                });
        } else {
            const module = this.loadModule(path, respectLoadingMode);

            await module.initializeAsync(this);
        }
    }

    public register<T extends TComponent, TComponent = Component<T>>(componentInfo: IComponentInfo<TComponent>): IComponentCollection {
        if (!componentInfo || !Object.isObject(componentInfo)) {
            throw new Error("componentInfo must be provided.");
        }

        if (!String.isString(componentInfo.name) || String.isEmptyOrWhitespace(componentInfo.name)) {
            throw new Error("componentInfo.name must be provided. (non-empty/whitespaces)");
        }

        if (!Function.isFunction(componentInfo.descriptor)) {
            throw new Error("componentInfo.descriptor function must be provided.");
        }

        return this.registerComponents([componentInfo]);
    }

    public getComponentAsync<T extends TComponent, TComponent = Component<T>>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T & Partial<IDisposable>> {
        if (String.isEmptyOrWhitespace(componentIdentity)) {
            throw new Error("componentIdentity cannot be null/undefined/empty.");
        }

        const component = this.container.getDep<T>(componentIdentity, ...extraArgs);

        if (component !== undefined) {
            return Promise.resolve(component);
        }

        return this.getComponentFromProxiesAsync<T & IDisposable>(null, componentIdentity, ...extraArgs);
    }

    public onHostVersionMismatch(callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler {
        if (callback === undefined) {
            return this.hostVersionMismatchHandler;
        } else if (callback === null) {
            this.hostVersionMismatchHandler = null;
        } else if (Function.isFunction(callback)) {
            this.hostVersionMismatchHandler = callback;
        } else {
            throw new Error("Provided callback must be a function.");
        }
    }

    public generateConstructorOptions(): IModuleManagerConstructorOptions {
        return {
            hostVersion: this.hostVersion,
            initialModules: this.loadedModules.filter((info) => info.loadingMode === "Always")
        };
    }

    private registerComponents(componentInfos: Array<IComponentInfo<any>>): IModuleManager {
        for (const componentInfo of componentInfos) {
            if (componentInfo.singleton === true) {
                this.container.set(componentInfo.name, createLazySingletonDiDescriptor(this, componentInfo.descriptor, componentInfo.deps));
            } else {
                this.container.set(componentInfo.name, createDedicationDiDescriptor(this, componentInfo.descriptor, componentInfo.deps));
            }
        }

        return this;
    }

    private async obtainChildAsync(hostName: string): Promise<IHostRecord> {
        let childIndex = this.children ? this.children.findIndex((child) => child.proxy.id === hostName) : -1;

        if (childIndex < 0) {
            await this.newHostAsync(hostName);
            childIndex = this.children.findIndex((child) => child.proxy.id === hostName);
        }

        return this.children[childIndex];
    }

    private loadModule(modulePath: string, respectLoadingMode?: boolean): IModule {
        if (!this.moduleLoadingPolicy.shouldLoad(this, path.basename(modulePath))) {
            return undefined;
        }

        const module: IModule = require(modulePath);

        if (!Function.isFunction(module.getModuleMetadata)) {
            throw new Error(`Invalid module "${modulePath}": missing getModuleMetadata().`);
        }

        const componentCollection = new ComponentCollection();
        const moduleInfo = module.getModuleMetadata(componentCollection);

        if (!this.moduleLoadingPolicy.shouldLoad(this, moduleInfo)) {
            return undefined;
        }

        this.moduleLoadingInfos.push({
            location: modulePath,
            name: moduleInfo.name,
            version: moduleInfo.version,
            hostVersion: moduleInfo.hostVersion,
            loadingMode: moduleInfo.loadingMode
        });

        if (respectLoadingMode === true && moduleInfo.loadingMode !== "Always") {
            return undefined;
        }

        if (!utils.isNullOrUndefined(moduleInfo.hostVersion)
            && !String.isEmptyOrWhitespace(moduleInfo.hostVersion)
            && !semver.gte(this.hostVersion, moduleInfo.hostVersion)) {
            if (!Function.isFunction(this.hostVersionMismatchHandler)
                || !this.hostVersionMismatchHandler(moduleInfo, this.hostVersion, moduleInfo.hostVersion)) {
                throw new Error(
                    `Invalid module "${path}": Expected host version: ${moduleInfo.hostVersion}. Current host version: ${this.hostVersion}`);
            }
        }

        this.registerComponents(componentCollection.getComponents());

        return module;
    }

    private async initializeModuleAsync(module: IModule): Promise<void> {
        if (Function.isFunction(module.initializeAsync)) {
            await module.initializeAsync(this);
        }
    }

    private async getComponentFromProxiesAsync<T>(
        fromProxy: IObjectRemotingProxy,
        componentIdentity: string,
        ...extraArgs: Array<any>)
        : Promise<T & IDisposable> {
        const fromProxyId = fromProxy ? fromProxy.id : null;

        if (this.children) {
            for (const child of this.children) {
                if (fromProxyId === child.proxy.id) {
                    continue;
                }

                const component = await child.proxy.requestAsync<T>(componentIdentity, ...extraArgs);

                if (component) {
                    return component;
                }
            }
        }

        if (this.parentProxy && this.parentProxy.id !== fromProxyId) {
            return this.parentProxy.requestAsync<T>(componentIdentity, ...extraArgs);
        }

        return undefined;
    }

    private onProxyResolvingAsync: Resolver =
        async (proxy: IObjectRemotingProxy, name: string, ...extraArgs: Array<any>): Promise<IDisposable> => {
            const dep = this.container.getDep<IDisposable>(name, ...extraArgs);

            if (dep) {
                return dep;
            }

            return this.getComponentFromProxiesAsync(proxy, name, ...extraArgs);
        }

    private onModuleManagerMessageAsync: AsyncRequestHandler =
        async (communicator: ICommunicator, path: string, content: IModuleManagerMessage): Promise<any> => {
            switch (content.action) {
                case ModuleManagerAction.loadModuleDirAsync:
                    const loadDirMsg = <ILoadModuleDirAsyncMessage>content;
                    await this.loadModuleDirAsync(loadDirMsg.content);
                    break;

                case ModuleManagerAction.loadModuleAsync:
                    const loadModuleMsg = <ILoadModuleAsyncMessage>content;
                    await this.loadModuleAsync(loadModuleMsg.content);
                    break;

                default:
                    throw new Error(`Unknown ModuleManagerAction: ${content.action}`);
            }
        }
}
