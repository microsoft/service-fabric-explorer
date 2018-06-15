//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDisposable, IDictionary } from "sfx.common";
import { ICommunicator, RequestHandler, IRoutePattern } from "sfx.remoting";
import { IObjectRemotingProxy, Resolver } from "sfx.proxy.object";

import * as utils from "../../utilities/utils";

import { IDataInfo } from "./data-info";

import {
    IDelegateMessage,
    IDelegator,
    DelegationType,
    IPropertyDelegationMessage,
    Delegation,
    ISetPropertyDelegationMessage,
    IApplyDelegationMessage,
    IDisposeDelegateMessage
} from "./delegate";

import { DataInfoManager } from "./data-info-manager";

enum ProxyActionType {
    RequestResource = "RequestResource",
    Delegate = "Delegate"
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

interface IDelegationProxyMessage extends IProxyMessage {
    delegateType: DelegationType;
    content: IDelegateMessage;
}

function isProxyMessage(msg: any): msg is IProxyMessage {
    return !utils.isNullOrUndefined(msg)
        && ProxyActionTypeValues.includes(msg.action);
}

export class ObjectRemotingProxy implements IObjectRemotingProxy, IDelegator {
    public readonly id: string;

    public get routePattern(): IRoutePattern {
        return this.pathPattern;
    }

    public get communicator(): ICommunicator {
        return this._communicator;
    }

    private readonly symbol_refId: symbol = Symbol("refId");

    private readonly ownCommunicator: boolean;

    private pathPattern: IRoutePattern;

    private resolver: Resolver;

    private messageHandlers: IDictionary<RequestHandler>;

    private dataInfoManager: DataInfoManager;

    private _communicator: ICommunicator;

    public static create(
        pathPattern: IRoutePattern,
        communicator: ICommunicator,
        ownCommunicator?: boolean)
        : IObjectRemotingProxy {
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }

        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }

        return new ObjectRemotingProxy(pathPattern, communicator, ownCommunicator);
    }

    public async requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: any[]): Promise<T> {
        this.validateDisposal();

        const tempReferer = this.dataInfoManager.ReferAsDataInfo(() => undefined);
        const extraArgsDataInfos = extraArgs.map((arg) => this.dataInfoManager.ReferAsDataInfo(arg, tempReferer.id));

        const targetDataInfo: IDataInfo =
            await this.communicator.sendAsync<IRequestResourceProxyMessage, IDataInfo>(
                this.pathPattern.getRaw(),
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
            throw new Error("resolver must be a function.");
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
            this.communicator.unmap(this.pathPattern);
            this._communicator = undefined;

            this.messageHandlers = undefined;

            this.dataInfoManager.dispose();
            this.dataInfoManager = undefined;
        }
    }

    public delegateAsync(type: DelegationType, msg: IDelegateMessage): Promise<IDataInfo> {
        return this.communicator.sendAsync<IDelegationProxyMessage, IDataInfo>(
            this.pathPattern.getRaw(),
            {
                action: ProxyActionType.Delegate,
                delegateType: type,
                content: msg
            });
    }

    private constructor(
        pathPattern: IRoutePattern,
        communicator: ICommunicator,
        ownCommunicator?: boolean) {
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }

        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }

        this._communicator = communicator;
        this.ownCommunicator = ownCommunicator === true;
        this.pathPattern = pathPattern;
        this.messageHandlers = {};
        this.dataInfoManager = new DataInfoManager(new Delegation(this));
        this.initializeMessageHandlers();

        this.communicator.map(this.pathPattern, this.onMessage);
    }

    private async resolveAsync(name: string, ...extraArgs: Array<any>): Promise<any> {
        if (this.resolver) {
            return await this.resolver(this, name, ...extraArgs);
        }

        return undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Proxy (${this.id}) already disposed.`);
        }
    }

    private initializeMessageHandlers() {
        this.messageHandlers[ProxyActionType.RequestResource] = this.onRequestResource;
        this.messageHandlers[ProxyActionType.Delegate] = this.onDelegate;
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

    private onDelegate = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): any | Promise<any> => {
        switch (msg.delegateType) {
            case DelegationType.Apply:
                return this.onApply(communicator, path, msg);

            case DelegationType.Dispose:
                return this.onDispose(communicator, path, msg);

            case DelegationType.GetProperty:
                return this.onGetProperty(communicator, path, msg);

            case DelegationType.SetProperty:
                return this.onSetProperty(communicator, path, msg);

            default:
                throw new Error(`Unknown delegation type: ${msg.delegateType}`);
        }
    }

    private onGetProperty = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): any | Promise<any> => {
        const delegationMsg = <IPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        return this.dataInfoManager.ReferAsDataInfo(target[delegationMsg.property], delegationMsg.refId);
    }

    private onSetProperty = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): any | Promise<any> => {
        const delegationMsg = <ISetPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        target[delegationMsg.property] = this.dataInfoManager.realizeDataInfo(delegationMsg.value, delegationMsg.refId);

        return true;
    }

    private onApply = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): any | Promise<any> => {
        const delegationMsg = <IApplyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        if (typeof target !== "function") {
            throw new Error(`Target (${delegationMsg.refId}) is not a function which cannot be applied.`);
        }

        const result =
            target.call(
                this.dataInfoManager.realizeDataInfo(delegationMsg.thisArg, delegationMsg.refId),
                ...delegationMsg.args.map((item) => this.dataInfoManager.realizeDataInfo(item, delegationMsg.refId)));

        return this.dataInfoManager.ReferAsDataInfo(result, delegationMsg.refId);
    }

    private onDispose = async (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<void> => {
        const delegationMsg = <IDisposeDelegateMessage>msg.content;

        await this.dataInfoManager.releaseByIdAsync(delegationMsg.refId, delegationMsg.parentId, true);
    }

    private onRequestResource = async (communicator: ICommunicator, path: string, msg: IRequestResourceProxyMessage): Promise<IDataInfo> => {
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
