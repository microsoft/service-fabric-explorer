//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICommunicator, IProxy, ISender } from "../@types/ipc";
import "../utilities/utils";
import error from "../utilities/errorUtil";
import { ModuleManager, Identity } from "./module-manager";
import ElectronCommunicator from "../modules/ipc/communicator-electron";
import ElectronProxy from "../modules/ipc/proxy-electron";
import { appCodeName } from "../utilities/appUtils";

const IpcChannelName = appCodeName + "/module-manager";

enum EventNames {
    requestHostVersion = "request-hostversion",
    pushComponents = "push-components"
}

export class ModuleManagerAgent extends ModuleManager {
    private readonly communicator: ICommunicator;
    private readonly proxy: IProxy;

    private readonly onResolveComponent: (objectIdentity: string, ...args: Array<any>) => Object;

    constructor() {
        const communicator: ICommunicator = new ElectronCommunicator(null, IpcChannelName);

        const hostVersion: string = communicator.sendSync(EventNames.requestHostVersion);

        super(hostVersion);

        this.onResolveComponent = (objectIdentity, ...args) => super.getComponent(objectIdentity, ...args);

        this.communicator = communicator;
        this.proxy = new ElectronProxy(this.communicator);
        this.proxy.on("resolve-object", this.onResolveComponent);
    }

    public getComponent<T>(componentIdentityString: string, ...extraArgs: Array<any>): T {
        let component = super.getComponent<T>(componentIdentityString, extraArgs);

        if (component !== undefined) {
            return component;
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
}

export class ModuleManagerHostAgent {
    private readonly moduleManager: IModuleManager;
    private readonly communicator: ICommunicator;
    private readonly proxy: IProxy;

    constructor(moduleManager: IModuleManager) {
        if (!Object.isObject(moduleManager)) {
            throw error("moduleManager must be supplied.");
        }

        this.moduleManager = moduleManager;
        this.communicator = new ElectronCommunicator(null, IpcChannelName);
        this.proxy = this.moduleManager.getComponent("ipc-proxy-electron", this.communicator, false);

        this.communicator.on(EventNames.requestHostVersion, this.onRequestHostVersion);
        this.communicator.on(EventNames.pushComponents, this.onPushComponents);
        this.proxy.on("resolve-object", this.onResolveComponent);
    }

    private readonly onPushComponents = (responser: ISender, componentInfos: Array<IComponentInfo>): Array<Error> => {
        componentInfos.forEach((componentInfo) => {
            const identity: string = Identity.fromNameVersion(componentInfo.name, componentInfo.version).identity;

            componentInfo.descriptor = (...args) => this.proxy.requestObjectFromProxy(responser.id, identity, ...args);
        });

        return this.moduleManager.registerComponents(componentInfos);
    }

    private readonly onRequestHostVersion = (): string => {
        return this.moduleManager.hostVersion;
    }

    private readonly onResolveComponent = (objectIdentity: string, ...args: Array<any>): Object => {
        return this.moduleManager.getComponent(objectIdentity, ...args);
    }
}
