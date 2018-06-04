//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as sfxRemoting from "sfx.remoting";

import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

import { IDataInfo, dataTypeOf, DataType, isDataInfo } from "./data-info";
import { ReferenceNode } from "./reference-node";
import { IDelegateMessage, IDelegator, DelegationType, IPropertyDelegationMessage, Delegation, ISetPropertyDelegationMessage, IApplyDelegationMessage, IDisposeDelegateMessage } from "./delegate";
import { DataInfoManager } from "./data-info-manager";

enum ProxyActionType {
    RequestResource = "RequestResource"
}

const ProxyActionTypeValues: Array<string> = Object.values(ProxyActionType);

interface IProxyMessage {
    action: string;
}

interface IRequestResourceProxyMessage extends IProxyMessage {
    action: ProxyActionType.RequestResource;
    resourceId: string;
    extraArgs: Array<IDataInfo>;
}

interface IGenericProxyMessage extends IProxyMessage {
    content: IDelegateMessage;
}

function isProxyMessage(msg: any): msg is IProxyMessage {
    return !utils.isNullOrUndefined(msg)
        && ProxyActionTypeValues.includes(msg.action)
        && !String.isNullUndefinedOrWhitespace(msg.resourceId);
}

class RemotingProxy implements sfxRemoting.IRemotingProxy, IDelegator {
    public readonly id: string;

    private readonly path: string;

    private readonly symbol_refId: symbol = Symbol("refId");

    private readonly ownCommunicator: boolean;

    private resolver: Resolver;

    private messageHandlers: IDictionary<RequestHandler>;

    private dataInfoManager: DataInfoManager;

    private communicator: ICommunicator;

    constructor(communicator: ICommunicator, ownCommunicator?: boolean) {
        if (utils.isNullOrUndefined(communicator)) {
            throw error("communicator must be provided.");
        }

        this.communicator = communicator;
        this.ownCommunicator = ownCommunicator === true;

        this.messageHandlers = {};
        this.dataInfoManager = new DataInfoManager(new Delegation(this));
    }

    public async requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: any[]): Promise<T> {
        this.validateDisposal();

        const tempReferer = this.dataInfoManager.ReferAsDataInfo(() => undefined);
        const extraArgsDataInfos = extraArgs.map((arg) => this.dataInfoManager.ReferAsDataInfo(arg, tempReferer.id));

        const targetDataInfo: IDataInfo =
            await this.communicator.sendAsync<IRequestResourceProxyMessage, IDataInfo>(
                this.path,
                {
                    action: ProxyActionType.RequestResource,
                    resourceId: identifier,
                    extraArgs: extraArgsDataInfos
                });

        if (targetDataInfo.id) {
            extraArgsDataInfos.forEach((argDataInfo) => {
                if (argDataInfo.id) {
                    this.dataInfoManager.AddReferenceById(argDataInfo.id, targetDataInfo.id);
                }
            });
        }

        await this.dataInfoManager.releaseByIdAsync(tempReferer.id);

        return this.dataInfoManager.realizeDataInfo(targetDataInfo);
    }

    public setResolver(resolver: Resolver): void {
        this.validateDisposal();

        if (resolver && !Function.isFunction(resolver)) {
            throw error("resolver must be a function.");
        }

        this.resolver = resolver;
    }

    public getResolver(): Resolver {
        this.validateDisposal();
        return this.resolver;
    }

    public get disposed(): boolean {
        return !this.messageHandlers || !this.dataInfoManager;
    }

    public async dispose(): Promise<void> {
        if (!this.disposed) {
            this.communicator.unmap(this.path);
            this.communicator = undefined;

            this.messageHandlers = undefined;

            this.dataInfoManager.dispose();
            this.dataInfoManager = undefined;
        }
    }

    public delegate(type: DelegationType, msg: IDelegateMessage): IDataInfo | Promise<IDataInfo> {
        return this.communicator.sendAsync<IGenericProxyMessage, IDataInfo>(
            this.path,
            {
                action: type,
                content: msg
            });
    }

    private async resolveAsync(name: string, ...extraArgs: Array<any>): Promise<any> {
        if (this.resolver) {
            return await this.resolver(name, ...extraArgs);
        }

        return undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw error("Proxy ({}) already disposed.", this.id);
        }
    }

    private initializeMessageHandlers() {
        this.messageHandlers[ProxyActionType.RequestResource] = this.onRequestResource;
        this.messageHandlers[DelegationType.GetProperty] = this.onGetProperty;
        this.messageHandlers[DelegationType.SetProperty] = this.onSetProperty;
        this.messageHandlers[DelegationType.Apply] = this.onApply;
        this.messageHandlers[DelegationType.Dispose] = this.onDispose;
    }

    private onMessage = (communicator, path, proxyMsg: IProxyMessage): any | Promise<any> => {
        if (!isProxyMessage(proxyMsg)) {
            // Log Error.
            return;
        }

        const requestHandler = this.messageHandlers[proxyMsg.action];

        if (!requestHandler) {
            // Log Error.
            return;
        }

        return requestHandler(communicator, path, proxyMsg);
    }

    private onGetProperty = (communicator, path, msg: IGenericProxyMessage): any | Promise<any> => {
        const delegationMsg = <IPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw error("Target ({}) doesn't exist.", delegationMsg.refId);
        }

        return this.dataInfoManager.ReferAsDataInfo(target[delegationMsg.property], delegationMsg.refId);
    }

    private onSetProperty = (communicator, path, msg: IGenericProxyMessage): any | Promise<any> => {
        const delegationMsg = <ISetPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw error("Target ({}) doesn't exist.", delegationMsg.refId);
        }

        target[delegationMsg.property] = this.dataInfoManager.realizeDataInfo(delegationMsg.value, delegationMsg.refId);

        return true;
    }

    private onApply = (communicator, path, msg: IGenericProxyMessage): any | Promise<any> => {
        const delegationMsg = <IApplyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw error("Target ({}) doesn't exist.", delegationMsg.refId);
        }

        if (typeof target !== "function") {
            throw error("Target ({}) is not a function which cannot be applied.", delegationMsg.refId);
        }

        const result =
            target.call(
                this.dataInfoManager.realizeDataInfo(delegationMsg.thisArg, delegationMsg.refId),
                ...delegationMsg.args.map((item) => this.dataInfoManager.realizeDataInfo(item, delegationMsg.refId)));

        return this.dataInfoManager.ReferAsDataInfo(result, delegationMsg.refId);
    }

    private onDispose = async (communicator, path, msg: IGenericProxyMessage): Promise<void> => {
        const delegationMsg = <IDisposeDelegateMessage>msg.content;

        await this.dataInfoManager.releaseByIdAsync(delegationMsg.refId, delegationMsg.parentId, true);
    }

    private onRequestResource = async (communicator, path, msg: IRequestResourceProxyMessage): Promise<IDataInfo> => {
        const tempReferer = this.dataInfoManager.ReferAsDataInfo(() => undefined);
        const extraArgs = msg.extraArgs.map((argDataInfo) => this.dataInfoManager.realizeDataInfo(argDataInfo, tempReferer.id));

        const target = await this.resolveAsync(msg.resourceId, ...extraArgs);
        const targetDataInfo = this.dataInfoManager.ReferAsDataInfo(target);

        if (targetDataInfo.id) {
            msg.extraArgs.forEach((argDataInfo) => {
                if (argDataInfo.id) {
                    this.dataInfoManager.AddReferenceById(argDataInfo.id, targetDataInfo.id);
                }
            });
        }

        await this.dataInfoManager.releaseByIdAsync(tempReferer.id);

        return targetDataInfo;
    }
}
