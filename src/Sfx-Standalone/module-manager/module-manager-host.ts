//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog, ILogger } from "../@types/log";
import * as utils from "../utilities/utils";
import error from "../utilities/errorUtil";
import { ModuleManager, Identity } from "./module-manager";
import { appCodeName } from "../utilities/appUtils";
import { Log } from "../modules/logging/log";
import { local } from "../utilities/resolve";

const IpcChannelName = appCodeName + "/module-manager";

enum EventNames {
    requestHostVersion = "request-hostVersion",
    pushComponents = "push-components",
    resolveComponentIdentity = "resolve-componentIdentity"
}

class LogWrapper implements ILog {
    private log: ILog;

    public writeMore(properties: IDictionary<string>, severity: "event" | "verbose" | "info" | "warning" | "error" | "critical", messageOrFormat: string, ...params: any[]): void {
        this.log.writeMore(properties, severity, messageOrFormat, ...params);
    }

    public write(severity: "event" | "verbose" | "info" | "warning" | "error" | "critical", messageOrFormat: string, ...params: any[]): void {
        this.log.write(severity, messageOrFormat, ...params);
    }

    public writeInfo(messageOrFormat: string, ...params: any[]): void {
        this.log.writeInfo(messageOrFormat, ...params);
    }

    public writeVerbose(messageOrFormat: string, ...params: any[]): void {
        this.log.writeVerbose(messageOrFormat, ...params);
    }

    public writeWarning(messageOrFormat: string, ...params: any[]): void {
        this.log.writeWarning(messageOrFormat, ...params);
    }

    public writeError(messageOrFormat: string, ...params: any[]): void {
        this.log.writeError(messageOrFormat, ...params);
    }

    public writeCritical(messageOrFormat: string, ...params: any[]): void {
        this.log.writeCritical(messageOrFormat, ...params);
    }

    public writeException(exception: Error, properties?: IDictionary<string>): void {
        this.log.writeException(exception, properties);
    }

    public writeEvent(name: string, properties?: IDictionary<string>): void {
        this.log.writeEvent(name, properties);
    }

    public writeMetric(name: string, value?: number, properties?: IDictionary<string>): void {
        this.log.writeMetric(name, value, properties);
    }

    public setLogger(name: string, logger?: ILogger): void {
        this.log.setLogger(name, logger);
    }

    public getLogger(name: string): ILogger {
        return this.log.getLogger(name);
    }

    public setLog(log: ILog): void {
        this.log = log;
    }

    constructor() {
        this.log = new Log();
    }
}

export class ModuleManagerAgent extends ModuleManager {
    private readonly log: LogWrapper;
    private readonly communicator: ICommunicator;
    private readonly proxy: IProxy;

    private readonly onResolveComponent: (objectIdentity: string, ...args: Array<any>) => Object;

    constructor() {
        const log = new LogWrapper();
        const communicator: ICommunicator = new ElectronCommunicator(log, null, IpcChannelName);

        const hostVersion: string = communicator.sendSync(EventNames.requestHostVersion);

        super(hostVersion, false);

        this.log = log;
        this.onResolveComponent = (objectIdentity, ...args) => super.getComponent(objectIdentity, ...args);

        this.communicator = communicator;
        this.proxy = new ElectronProxy(this.log, this.communicator);
        this.proxy.on("resolve-object", this.onResolveComponent);
        this.log.setLog(this.getComponent("log"));
        this.loadModule(local("./modules/ipc", true));
    }

    public getInstance<T>(componentIdentityString: string, ...extraArgs: Array<any>): T {
        const instnace = super.getInstance<T>(componentIdentityString, ...extraArgs);

        if (instnace !== undefined) {
            return instnace;
        }

        return <any>this.proxy.requestObject(componentIdentityString, ...extraArgs);
    }

    protected loadComponents(componentInfoDictionary: IDictionary<IComponentInfo>): Array<Error> {
        const errors = super.loadComponents(componentInfoDictionary);

        if (errors === null || errors.length <= 0) {
            const componentInfos = Object.values(componentInfoDictionary);

            componentInfos.forEach((componentInfo) => componentInfo.descriptor === undefined);

            return this.communicator.sendSync(EventNames.pushComponents, componentInfos);
        }

        return errors;
    }

    protected loadComponentByIdentity(
        parentComponentIdentity: Identity,
        componentIdentity: Identity,
        componentInfoDictionary: IDictionary<IComponentInfo>,
        referenceStack?: IDictionary<string>): Identity {
        let depIdentity = super.loadComponentByIdentity(parentComponentIdentity, componentIdentity, componentInfoDictionary, referenceStack);

        if (utils.isNullOrUndefined(depIdentity)) {
            const resolvedIdentityString = this.communicator.sendSync<string>(EventNames.resolveComponentIdentity, componentIdentity.identity);

            return String.isNullUndefinedOrWhitespace(resolvedIdentityString) ? null : Identity.fromIdentityString(resolvedIdentityString);
        }

        return depIdentity;
    }
}

export class ModuleManagerHostAgent {
    private readonly log: ILog;
    private readonly moduleManager: IModuleManager;
    private readonly communicator: ICommunicator;
    private readonly proxy: IProxy;

    constructor(moduleManager: IModuleManager) {
        if (!Object.isObject(moduleManager)) {
            throw error("moduleManager must be supplied.");
        }

        this.moduleManager = moduleManager;
        this.log = this.moduleManager.getComponent("log");
        this.communicator = new ElectronCommunicator(this.log, null, IpcChannelName);
        this.proxy = this.moduleManager.getComponent("ipc-proxy-electron", this.communicator, false);

        this.communicator.on(EventNames.resolveComponentIdentity, this.onResolveComponentIdentity);
        this.communicator.on(EventNames.requestHostVersion, this.onRequestHostVersion);
        this.communicator.on(EventNames.pushComponents, this.onPushComponents);
        this.proxy.on("resolve-object", this.onResolveComponent);
    }

    private readonly onPushComponents = (responser: ISender, componentInfos: Array<IComponentInfo>): Array<Error> => {
        for (let componentInfoIndex = componentInfos.length - 1; componentInfoIndex >= 0; componentInfoIndex--) {
            const componentInfo = componentInfos[componentInfoIndex];
            const identity: string = Identity.fromNameVersion(componentInfo.name, componentInfo.version).identity;

            if (this.moduleManager.resolveComponentIdentity(identity) === identity) {
                componentInfos[componentInfoIndex] = componentInfos[componentInfos.length - 1];
                componentInfos.pop();
            } else {
                componentInfo.descriptor = (...args) => this.proxy.requestObjectFromProxy(responser.id, identity, ...args);
            }
        }

        return this.moduleManager.registerComponents(componentInfos);
    }

    private readonly onRequestHostVersion = (): string => {
        this.log.writeVerbose("Request to host version is recevied. (hostVersion: {})", this.moduleManager.hostVersion);
        return this.moduleManager.hostVersion;
    }

    private readonly onResolveComponent = (objectIdentity: string, ...args: Array<any>): Object => {
        this.log.writeVerbose("Resolving component: {}", objectIdentity);
        return this.moduleManager.getComponent(objectIdentity, ...args);
    }

    private readonly onResolveComponentIdentity = (responser, componentIdentity: string): string => {
        this.log.writeVerbose("Resolving component identity: {}", componentIdentity);
        return this.moduleManager.resolveComponentIdentity(componentIdentity);
    }
}
