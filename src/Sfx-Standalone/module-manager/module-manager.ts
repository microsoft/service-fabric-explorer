//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    IDictionary,
    IModuleInfo,
    IModuleManager,
    IComponentDescriptor,
    IComponentInfo,
    HostVersionMismatchEventHandler
} from "sfx";

import { ICommunicator } from "sfx.ipc";

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import * as semver from "semver";

import { NodeCommunicator } from "../modules/ipc/communicator.node";
import error from "../utilities/errorUtil";
import * as utils from "../utilities/utils";
import * as di from "../utilities/di";
import * as diExt from "../utilities/di.ext";

interface IModule {
    getModuleMetadata?(): IModuleInfo;
    initialize?(moduleManager: IModuleManager): void;
}

namespace ComponentDescriptors {
    export function lazySingleton(componentIdentity: string, componentDescriptor: IComponentDescriptor, injects: Array<string>): di.IDiDescriptor {
        let instance: any = null;

        return (container, ...extraArgs) => {
            if (instance === null) {
                instance = dedication(componentIdentity, componentDescriptor, injects)(container, extraArgs);

                componentIdentity = undefined;
                componentDescriptor = undefined;
                injects = undefined;
            }

            return instance;
        };
    }

    export function dedication(componentIdentity: string, componentDescriptor: IComponentDescriptor, injects: Array<string>): di.IDiDescriptor {
        return (container, ...extraArgs) => {
            const deps = new Array<any>();

            if (injects !== undefined) {
                for (let injectIndex = 0; injectIndex < injects.length; injectIndex++) {
                    const inject = injects[injectIndex];

                    if (inject !== undefined) {
                        let dep: any = container.getDep(inject);

                        if (dep === undefined) {
                            throw error("{}: dependency, '{}', is missing.", componentIdentity, inject);
                        }

                        deps.push(dep);
                    }
                }
            }

            for (let extraArgIndex = 0; extraArgIndex < extraArgs.length; extraArgIndex++) {
                deps.push(extraArgs[extraArgIndex]);
            }

            return componentDescriptor(...deps);
        };
    }
}

class VersionedDiDescriptorDictionary implements di.IDiDescriptorDictionary {

    private readonly dictionary: IDictionary<IDictionary<di.IDiDescriptor>>;

    constructor() {
        this.dictionary = {};
    }

    public get(name: string): di.IDiDescriptor {
        const identity = Identity.fromIdentityString(name);

        if (identity === null) {
            throw error("name must follow format: {{name: [A-Za-z0-9\-\.]+}@{{version: [A-Za-z0-9\-\.]+} or {{name: [A-Za-z0-9\-\.]+} only.");
        }

        const descriptors = this.dictionary[identity.name];

        if (descriptors === undefined) {
            return undefined;
        }

        if (identity.version === undefined) {
            return descriptors["*"];
        } else {
            return descriptors[identity.version];
        }
    }

    public set(name: string, descriptor: di.IDiDescriptor): void {
        const identity = Identity.fromIdentityString(name);

        if (identity === null) {
            throw error("name must follow format: {{name: [A-Za-z0-9\-\.]+}@{{semver} or {{name: [A-Za-z0-9\-\.]+} only.");
        }

        if (!Function.isFunction(descriptor)) {
            throw error("descriptor must be a function.");
        }

        let descriptors = this.dictionary[identity.name];

        if (descriptors === undefined) {
            descriptors = {};
            descriptors["*"] = descriptor;

            if (identity.version !== undefined) {
                descriptors[identity.version] = descriptor;
            }

            this.dictionary[identity.name] = descriptors;
            return;
        } else {
            let highestVersion = "0.0.0";

            Object.keys(descriptors).forEach((version) => {
                if (version !== "*" && semver.gt(version, highestVersion)) {
                    highestVersion = version;
                }
            });

            if (semver.gt(identity.version, highestVersion)) {
                descriptors["*"] = descriptor;
            }

            descriptors[identity.version] = descriptor;
        }
    }
}

export class Identity {
    private static readonly nameRegex = /^[\w\-\.]+$/i;
    private static readonly identityRegex = /^([\w\-\.]+)(?:\@([\w\-\.]+))?$/i;

    public readonly name: string;

    public readonly version: string;

    public readonly identity: string;

    public static fromIdentityString(identityString: string): Identity {
        const regexMatches = Identity.identityRegex.exec(identityString);

        if (regexMatches === null) {
            return null;
        }

        return Identity.fromNameVersion(regexMatches[1], regexMatches[2]);
    }

    public static fromNameVersion(name: string, version?: string): Identity {
        if (Identity.nameRegex.test(name)
            && (String.isNullUndefinedOrWhitespace(version)
                || semver.valid(version) !== null)) {
            return Object.freeze(new Identity(name, version));
        }

        return null;
    }

    public static findByIdentityName<T>(identityName: string, identities: Array<string>): Array<string> {
        const results = new Array<string>();

        identities.forEach((identity) => {
            const matches = Identity.identityRegex.exec(identity);

            if (matches === null) {
                return;
            }

            if (matches[1] !== identityName) {
                return;
            }

            results.push(identity);
        });

        return results;
    }

    public toString() {
        return this.identity;
    }

    private constructor(name: string, version?: string) {
        if (String.isNullUndefinedOrWhitespace(name) || !String.isString(name)) {
            throw error("name must be a string with value (not empty or whitespaces).");
        } else if (String.isString(name)) {
            this.name = name;
        }

        if (String.isNullUndefinedOrWhitespace(version)) {
            this.version = undefined;
        } else if (String.isString(version)) {
            this.version = version;
        } else {
            throw error("version must be a string or null/undefined/empty.");
        }

        this.identity = this.name + (this.version ? "@" + this.version : "");
    }
}

export class ModuleManager extends di.DiContainer implements IModuleManager {
    public readonly hostVersion: string;

    private readonly throwIfComponentNotFound: boolean;

    private readonly options: boolean;

    private hostVersionMismatchEvent: HostVersionMismatchEventHandler;

    private depVersionMismatchEvent: DepVersionMismatchEventHandler;

    private static loadModule(modulePath: string): IModule {
        return require(modulePath);
    }

    private static pushToComponentDictionary(
        dictionary: IDictionary<IComponentInfo>,
        componentInfos: Array<IComponentInfo>): Array<Error> {
        const errors = new Array<Error>();

        componentInfos.forEach((componentInfo) => {
            const componentIdentity = Identity.fromNameVersion(componentInfo.name, componentInfo.version);

            if (componentIdentity === null) {
                errors.push(error("The name or version of component is invalid. name should follow [\w\-\.]+ and version should be null/undefined/semver."));
                return;
            }

            dictionary[componentIdentity.identity] = componentInfo;
        });

        return errors.length > 0 ? errors : null;
    }

    private static pushReferenceStack(identity: string, referenceStack: IDictionary<string>): void {
        if (undefined !== referenceStack[identity]) {
            throw error("{}: circle reference detected.", identity);
        } else {
            referenceStack[identity] = identity;
        }
    }

    private static popReferenceStack(identity: string, referenceStack: IDictionary<string>): void {
        delete referenceStack[identity];
    }

    constructor(hostVersion?: string, throwIfComponentNotFound?: boolean) {
        super(new VersionedDiDescriptorDictionary());
        this.hostVersion = !String.isNullUndefinedOrWhitespace(hostVersion) ? hostVersion : "*";
        this.throwIfComponentNotFound = utils.getEither(throwIfComponentNotFound, true);
        this.set("module-manager", diExt.DiDescriptorConstructor.singleton(this));
    }

    public resolveComponentIdentity(componentIdentity: string): string {
        const resolvedIdentity = this.loadComponentByIdentity(null, Identity.fromIdentityString(componentIdentity), {}, undefined);

        return resolvedIdentity ? resolvedIdentity.identity : null;
    }

    public loadModules(folderPath: string): IDictionary<Array<Error>> {
        if (String.isNullUndefinedOrWhitespace(folderPath)) {
            throw error("folderPath must be a string containing the path to the folder.");
        }

        if (!fs.existsSync(folderPath)) {
            return null;
        }

        const items = fs.readdirSync(folderPath);
        const componentInfoDictionary: IDictionary<IComponentInfo> = {};
        const errorDictionary: IDictionary<Array<Error>> = {};
        const modules = new Array<IModule>();

        items.forEach((itemName) => {
            const modulePath = path.resolve(path.join(folderPath, itemName));

            if (fs.statSync(modulePath).isFile()
                && path.extname(modulePath).toUpperCase() !== ".JS") {
                return;
            }

            const module = ModuleManager.loadModule(modulePath);

            modules.push(module);

            const moduleInfo = this.loadModuleInfo(module);

            if (utils.isNullOrUndefined(moduleInfo)) {
                // Write warning.
                return;
            }

            const moduleIdentity = Identity.fromNameVersion(moduleInfo.name, moduleInfo.version);

            if (moduleIdentity === null) {
                errorDictionary[path.resolve(path.join(folderPath, itemName))] = [error("The name or version of the module is invalid. name should follow [\w\-\.]+ and version should be null/undefined/semver.")];
                return;
            }

            if (!Array.isArray(moduleInfo.components)) {
                // Write warning.
                return;
            }

            const errors = ModuleManager.pushToComponentDictionary(componentInfoDictionary, moduleInfo.components);

            if (errors !== null) {
                errorDictionary[moduleIdentity.toString()] = errors;
            }
        });

        const componentErrors = this.loadComponents(componentInfoDictionary);

        if (componentErrors !== null) {
            errorDictionary["@components"] = componentErrors;
        }
        modules.forEach((module) => this.initializeModule(module));

        return Object.keys(errorDictionary).length > 0 ? errorDictionary : null;
    }

    public loadModule(modulePath: string): Array<Error> {
        if (String.isNullUndefinedOrWhitespace(path)) {
            throw error("path must be a string containing the path to the module.");
        }

        modulePath = path.resolve(modulePath);
        fs.accessSync(modulePath);

        const module = ModuleManager.loadModule(modulePath);
        const moduleInfo = this.loadModuleInfo(module);

        if (utils.isNullOrUndefined(moduleInfo)) {
            // Write warning.
            return;
        }

        const moduleIdentity = Identity.fromNameVersion(moduleInfo.name, moduleInfo.version);

        if (moduleIdentity === null) {
            return [error("The name or version of the module is invalid. name should follow [\w\-\.]+ and version should be null/undefined/semver.")];
        }

        if (!Array.isArray(moduleInfo.components)) {
            // Write info: indicate the module doesn't have any components (possible it is a plugin).
            return null;
        }

        const mergedErrors = new Array<Error>();
        const componentInfoDictionary: IDictionary<IComponentInfo> = {};
        let errors: Array<Error>;

        errors = ModuleManager.pushToComponentDictionary(componentInfoDictionary, moduleInfo.components);

        if (errors !== null) {
            mergedErrors.push(...mergedErrors);
        }

        errors = this.loadComponents(componentInfoDictionary);
        this.initializeModule(module);

        if (errors !== null) {
            mergedErrors.push(...errors);
        }

        return mergedErrors.length > 0 ? mergedErrors : null;
    }

    public registerComponents(componentInfos: Array<IComponentInfo>): Array<Error> {
        if (!Array.isArray(componentInfos)) {
            throw error("componentInfo must be supplied.");
        }

        const componentInfoDictionary: IDictionary<IComponentInfo> = {};
        let errors = ModuleManager.pushToComponentDictionary(componentInfoDictionary, componentInfos);

        if (errors && errors.length > 0) {
            return errors;
        }

        return this.loadComponents(componentInfoDictionary);
    }

    public getInstance<T>(componentIdentityString: string, ...extraArgs: Array<any>): T {
        const componentIdentity = Identity.fromIdentityString(componentIdentityString);

        if (componentIdentity === null) {
            throw error("componentIdentityString, '{}', is Invalid!", componentIdentityString);
        }

        const instance = super.getInstance<T>(componentIdentity.identity, ...extraArgs);

        if (instance === undefined && this.throwIfComponentNotFound) {
            throw error("Failed to get component: {}", componentIdentityString);
        }

        return instance;
    }

    public getComponent<T>(componentIdentityString: string, ...extraArgs: Array<any>): T {
        return this.getInstance(componentIdentityString, ...extraArgs);
    }

    public readonly onHostVersionMismatch = (callback?: HostVersionMismatchEventHandler): void | HostVersionMismatchEventHandler => {
        if (callback === undefined) {
            return this.hostVersionMismatchEvent;
        } else {
            this.hostVersionMismatchEvent = callback;
        }
    }

    public readonly onDepVersionMismatch = (callback?: DepVersionMismatchEventHandler): void | DepVersionMismatchEventHandler => {
        if (callback === undefined) {
            return this.depVersionMismatchEvent;
        } else {
            this.depVersionMismatchEvent = callback;
        }
    }

    protected loadComponents(componentInfoDictionary: IDictionary<IComponentInfo>): Array<Error> {
        const errors = new Array<Error>();

        for (const componentIdentity in componentInfoDictionary) {
            if (componentInfoDictionary.hasOwnProperty(componentIdentity)) {
                try {
                    this.loadComponent(componentInfoDictionary[componentIdentity], componentInfoDictionary);
                } catch (exception) {
                    errors.push(exception);
                }
            }
        }

        return errors.length > 0 ? errors : null;
    }

    protected loadComponentByIdentity(
        parentComponentIdentity: Identity,
        componentIdentity: Identity,
        componentInfoDictionary: IDictionary<IComponentInfo>,
        referenceStack?: IDictionary<string>): Identity {

        // Try to find the dependency with the name + version identity in NOT-loaded components.
        if (undefined !== componentInfoDictionary[componentIdentity.identity]) {
            return this.loadComponent(componentInfoDictionary[componentIdentity.identity], componentInfoDictionary, referenceStack);
        }

        // Try to find the dependency with the name + version identity in loaded components.
        if (undefined !== this.get(componentIdentity.identity)) {
            return componentIdentity;
        }

        // Try to find the dependency with the name identity in NOT-loaded components.
        const matchedComponentIdentities = Identity.findByIdentityName(componentIdentity.name, Object.keys(componentInfoDictionary));

        if (matchedComponentIdentities.length > 0) {
            if (Function.isFunction(this.depVersionMismatchEvent)) {
                if (!this.depVersionMismatchEvent(
                    utils.isNullOrUndefined(parentComponentIdentity) ? undefined : parentComponentIdentity.identity,
                    componentIdentity.identity)) {
                    throw error("{}: dependency, '{}', is missing.", parentComponentIdentity.identity, componentIdentity.identity);
                }
            }

            matchedComponentIdentities.forEach((identity) => this.loadComponent(componentInfoDictionary[identity], componentInfoDictionary, referenceStack));

            return Identity.fromIdentityString(componentIdentity.name);
        }

        // Try to find the dependency with the name identity in loaded components.
        if (undefined !== this.get(componentIdentity.name)) {
            return Identity.fromIdentityString(componentIdentity.name);
        }

        return null;
    }

    private initializeModule(module: IModule): void {
        if (!Function.isFunction(module.initialize)) {
            // Write Info.
            return;
        }

        module.initialize(this);
    }

    private loadModuleInfo(module: IModule): IModuleInfo {
        if (!Function.isFunction(module.getModuleMetadata)) {
            // Write warning.
            return null;
        }

        const moduleInfo = module.getModuleMetadata();

        if (!utils.isNullOrUndefined(moduleInfo)
            && this.hostVersion !== "*"
            && !String.isNullUndefinedOrWhitespace(moduleInfo.hostVersion)
            && moduleInfo.hostVersion !== "*"
            && !semver.eq(this.hostVersion, moduleInfo.hostVersion)
            && Function.isFunction(this.hostVersionMismatchEvent)) {
            if (!this.hostVersionMismatchEvent(moduleInfo, this.hostVersion, moduleInfo.hostVersion)) {
                return null;
            }
        }

        return moduleInfo;
    }

    private loadComponent(componentInfo: IComponentInfo, componentInfoDictionary: IDictionary<IComponentInfo>, referenceStack?: IDictionary<string>): Identity {
        const componentIdentity = Identity.fromNameVersion(componentInfo.name, componentInfo.version);

        if (!Function.isFunction(componentInfo.descriptor)) {
            throw error("{}: descriptor function must be supplied.", componentIdentity.identity);
        }

        ModuleManager.pushReferenceStack(componentIdentity.identity, referenceStack = referenceStack || {});

        if (Array.isNullUndefinedOrEmpty(componentInfo.deps)) {
            componentInfo.deps = undefined;
        } else if (!Array.isArray(componentInfo.deps)) {
            throw error("{}: deps must be an array of dependency identity.", componentIdentity.identity);
        }

        if (componentInfo.deps !== undefined) {
            for (let depIndex = 0; depIndex < componentInfo.deps.length; depIndex++) {
                if (String.isNullUndefinedOrWhitespace(componentInfo.deps[depIndex])) {
                    componentInfo.deps[depIndex] = undefined;
                    continue;
                }

                let depIdentity = Identity.fromIdentityString(componentInfo.deps[depIndex]);

                if (depIdentity === null) {
                    throw error("{}: dependency identity, '{}', is invalid.", componentIdentity.identity, componentInfo.deps[depIndex]);
                }

                depIdentity = this.loadComponentByIdentity(componentIdentity, depIdentity, componentInfoDictionary, referenceStack);

                if (depIdentity === null) {
                    throw error("{}: dependency, '{}', is missing.", componentIdentity.identity, componentInfo.deps[depIndex]);
                }

                componentInfo.deps[depIndex] = depIdentity.identity;
            }
        }

        if (utils.getEither(componentInfo.singleton, false)) {
            this.set(componentIdentity.identity, ComponentDescriptors.lazySingleton(componentIdentity.identity, componentInfo.descriptor, componentInfo.deps));
        } else {
            this.set(componentIdentity.identity, ComponentDescriptors.dedication(componentIdentity.identity, componentInfo.descriptor, componentInfo.deps));
        }

        delete componentInfoDictionary[componentIdentity.identity];
        ModuleManager.popReferenceStack(componentIdentity.identity, referenceStack);

        return componentIdentity;
    }
}

interface IHostRecord {
    process: child_process.ChildProcess;
    communicator: ICommunicator;
}

export class NewModuleManager implements IModuleManager {
    private readonly _hostVersion: string;

    private hostVersionMismatchHandler: HostVersionMismatchEventHandler;

    private children: IDictionary<IHostRecord>;

    private parentCommunicator: ICommunicator;

    private container: di.IDiContainer;

    public get hostVersion(): string {
        return this._hostVersion;
    }

    constructor(hostVersion: string, parentCommunicator?: ICommunicator) {
        this._hostVersion = hostVersion;
        this.container = new di.DiContainer();
        this.parentCommunicator = parentCommunicator;
    }

    public async newHostAsync(hostName: string): Promise<void> {
        const childProcess: child_process.ChildProcess = child_process.spawn("./bootstrap.js");
        const childCommunicator = new NodeCommunicator(childProcess, hostName);

        if (!this.children) {
            this.children = {};
        }

        this.children[hostName] = {
            process: childProcess,
            communicator: childCommunicator
        };
    }

    public async destroyHostAsync(hostName: string): Promise<void> {
        if (!this.children) {
            return;
        }

        const child = this.children[hostName];

        if (!child) {
            return;
        }

        await child.communicator.dispose();
        child.process.kill();
    }

    public loadModuleDirectoryAsync(dirName: string, hostName?: string): Promise<void> {

    }

    public loadModuleAsync(path: string, hostName?: string): Promise<void> {

    }

    public registerComponentsAsync(componentInfos: Array<IComponentInfo>): Promise<void> {

    }

    public getComponentAsync<T>(componentIdentity: string, ...extraArgs: Array<any>): Promise<T> {

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
}
