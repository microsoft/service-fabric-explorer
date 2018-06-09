//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IModuleInfo,
    IModuleManager,
    IComponentInfo,
    HostVersionMismatchEventHandler,
    IDisposable
} from "sfx";

import { ICommunicator, RequestHandler } from "sfx.ipc";
import { IRemotingProxy, Resolver } from "sfx.remoting";

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import * as semver from "semver";

import * as utils from "../utilities/utils";
import * as di from "../utilities/di";
import * as diExt from "../utilities/di.ext";
import { NodeCommunicator } from "../modules/ipc/communicator.node";
import { RemotingProxy } from "../modules/remoting/proxy";

enum ModuleManagerAction {
    loadModuleAsync = "loadModuleAsync",
    loadModuleDirAsync = "loadModuleDirAsync"
}

interface IModule {
    getModuleMetadata?(): IModuleInfo;
    initialize?(moduleManager: IModuleManager): void;
}

interface IHostRecord {
    process: child_process.ChildProcess;
    proxy: IRemotingProxy;
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

export class ModuleManager implements IModuleManager {
    private readonly _hostVersion: string;

    private readonly ipcPath: string;

    private hostVersionMismatchHandler: HostVersionMismatchEventHandler;

    private children: Array<IHostRecord>;

    private parentProxy: IRemotingProxy;

    private container: di.IDiContainer;

    public get hostVersion(): string {
        return this._hostVersion;
    }

    constructor(hostVersion: string, parentCommunicator?: ICommunicator, ipcPath?: string) {
        if (!semver.valid(hostVersion)) {
            throw new Error(`Invalid hostVersion "${hostVersion}".`);
        }

        this._hostVersion = hostVersion;

        if (parentCommunicator) {
            this.parentProxy = new RemotingProxy(parentCommunicator);
            parentCommunicator.map(this.ipcPath, this.onModuleManagerMessage);
        }

        this.ipcPath = ipcPath || "module-manager";
        this.container = new di.DiContainer();
    }

    public async newHostAsync(hostName: string): Promise<void> {
        if (String.isEmptyOrWhitespace(hostName)) {
            throw new Error("hostName cannot be null/undefined/empty.");
        }

        if (0 <= this.children.findIndex((child) => child.proxy.id === hostName)) {
            throw new Error(`hostName, "${hostName}", already exists.`);
        }

        const childProcess: child_process.ChildProcess = child_process.spawn("./bootstrap.js", [this.hostVersion]);
        const childCommunicator = new NodeCommunicator(childProcess, hostName);
        const proxy = new RemotingProxy(childCommunicator, true);

        if (!this.children) {
            this.children = [];
        }

        proxy.setResolver(this.onProxyResolving);

        this.children.push({
            process: childProcess,
            proxy: proxy,
            communicator: childCommunicator
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

        await child.proxy.dispose();
        child.process.kill();

        this.children.splice(childIndex, 1);

        child.communicator = undefined;
        child.process = undefined;
        child.proxy = undefined;
    }

    public async loadModuleDirAsync(dirName: string, hostName?: string): Promise<void> {
        if (!fs.existsSync(dirName)) {
            throw new Error(`Directory "${dirName}" doesn't exist.`);
        }

        const dirStat = fs.statSync(dirName);

        if (!dirStat.isDirectory()) {
            throw new Error(`Path "${dirName}" is not a directory.`);
        }

        if (!String.isEmptyOrWhitespace(hostName)) {
            let childIndex = this.children.findIndex((child) => child.proxy.id === hostName);

            if (childIndex < 0) {
                await this.newHostAsync(hostName);
                childIndex = this.children.findIndex((child) => child.proxy.id === hostName);
            }

            const child = this.children[childIndex];

            await child.communicator.sendAsync<ILoadModuleDirAsyncMessage, void>(
                this.ipcPath,
                {
                    action: ModuleManagerAction.loadModuleDirAsync,
                    content: dirName
                });
        } else {
            const loadingTasks: Array<Promise<void>> = [];

            for (const subName of fs.readdirSync(dirName)) {
                loadingTasks.push(this.loadModuleAsync(path.join(dirName, subName), hostName));
            }

            await Promise.all(loadingTasks);
        }
    }

    public async loadModuleAsync(path: string, hostName?: string): Promise<void> {
        if (!fs.existsSync(path)) {
            throw new Error(`path "${path}" doesn't exist.`);
        }

        if (!String.isEmptyOrWhitespace(hostName)) {
            let childIndex = this.children.findIndex((child) => child.proxy.id === hostName);

            if (childIndex < 0) {
                await this.newHostAsync(hostName);
                childIndex = this.children.findIndex((child) => child.proxy.id === hostName);
            }

            const child = this.children[childIndex];

            await child.communicator.sendAsync<ILoadModuleAsyncMessage, void>(
                this.ipcPath,
                {
                    action: ModuleManagerAction.loadModuleAsync,
                    content: path
                });
        } else {
            this.loadModule(path);
        }
    }

    public registerComponents(componentInfos: Array<IComponentInfo>): void {
        if (!Array.isArray(componentInfos)) {
            throw new Error("componentInfos must be an array of IComponentInfo.");
        }

        for (const componentInfo of componentInfos) {
            if (componentInfo.singleton === true) {
                this.container.set(componentInfo.name, diExt.lazySingleton(componentInfo.descriptor, componentInfo.deps));
            } else {
                this.container.set(componentInfo.name, diExt.dedication(componentInfo.descriptor, componentInfo.deps));
            }
        }
    }

    public async getComponentAsync<T extends IDisposable>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T> {
        if (String.isEmptyOrWhitespace(componentIdentity)) {
            throw new Error("componentIdentity cannot be null/undefined/empty.");
        }

        const component = this.container.getDep<T>(componentIdentity, ...extraArgs);

        if (component !== undefined) {
            return component;
        }

        return this.getComponentFromProxies<T>(componentIdentity, ...extraArgs);
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

    private loadModule(path: string): void {
        const module: IModule = require(path);

        if (!Function.isFunction(module.getModuleMetadata)) {
            throw new Error(`Invalid module "${path}": missing getModuleMetadata().`);
        }

        const moduleInfo = module.getModuleMetadata();

        if (!String.isEmptyOrWhitespace(moduleInfo.hostVersion)
            && !semver.gte(this.hostVersion, moduleInfo.hostVersion)) {
            if (!Function.isFunction(this.hostVersionMismatchHandler)
                || !this.hostVersionMismatchHandler(moduleInfo, this.hostVersion, moduleInfo.hostVersion)) {
                throw new Error(
                    `Invalid module "${path}": Expected host version: ${moduleInfo.hostVersion}. Current host version: ${this.hostVersion}`);
            }
        }

        if (moduleInfo.components) {
            if (!Array.isArray(moduleInfo.components)) {
                throw new Error(
                    `Invalid module "${path}": ModuleMetadata.components must be an array of IComponentInfo.`);
            }

            this.registerComponents(moduleInfo.components);
        }

        if (Function.isFunction(module.initialize)) {
            module.initialize(this);
        }
    }

    private async getComponentFromProxies<T extends IDisposable>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T> {
        if (!this.children) {
            return undefined;
        }

        for (const child of this.children) {
            const component = await child.proxy.requestAsync<T>(componentIdentity, ...extraArgs);

            if (component) {
                return component;
            }
        }

        if (!this.parentProxy) {
            return undefined;
        }

        return await this.parentProxy.requestAsync<T>(componentIdentity, ...extraArgs);
    }

    private onProxyResolving: Resolver =
        (name: string, ...extraArgs: Array<any>): IDisposable | Promise<IDisposable> => this.container.getDep(name, ...extraArgs)

    private onModuleManagerMessage: RequestHandler =
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
