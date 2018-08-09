//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDisposable, IDictionary } from "sfx.common";
import { ICommunicator, AsyncRequestHandler, IRoutePattern } from "sfx.remoting";
import { IObjectRemotingProxy, Resolver } from "sfx.proxy.object";

import * as uuidv4 from "uuid/v4";

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

    private readonly ownCommunicator: boolean;

    private pathPattern: IRoutePattern;

    private resolver: Resolver;

    private messageHandlers: IDictionary<AsyncRequestHandler>;

    private dataInfoManager: DataInfoManager;

    private _communicator: ICommunicator;

    public static create(
        pathPattern: IRoutePattern,
        communicator: ICommunicator,
        ownCommunicator?: boolean,
        proxyId?: string)
        : IObjectRemotingProxy {
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }

        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }

        return new ObjectRemotingProxy(pathPattern, communicator, ownCommunicator, proxyId);
    }

    public async requestAsync<T>(identifier: string, ...extraArgs: Array<any>): Promise<T & IDisposable> {
        this.validateDisposal();

        const tempReferer = this.dataInfoManager.referAsDataInfo(() => undefined);
        
        try {
            const extraArgsDataInfos = extraArgs.map((arg) => this.dataInfoManager.referAsDataInfo(arg, tempReferer.id));

            const targetDataInfo: IDataInfo =
                await this.communicator.sendAsync<IRequestResourceProxyMessage, IDataInfo>(
                    this.pathPattern.getRaw(),
                    {
                        action: ProxyActionType.RequestResource,
                        resourceId: identifier,
                        extraArgs: extraArgsDataInfos
                    });
            const target = this.dataInfoManager.realizeDataInfo(targetDataInfo);

            if (targetDataInfo.id) {
                extraArgsDataInfos.forEach((argDataInfo) => {
                    if (argDataInfo.id) {
                        this.dataInfoManager.addReferenceById(argDataInfo.id, targetDataInfo.id);
                    }
                });
            }

            return target;
        } finally {
            await this.dataInfoManager.releaseByIdAsync(tempReferer.id);
        }
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

    public async disposeAsync(): Promise<void> {
        if (!this.disposed) {
            this.communicator.unmap(this.pathPattern);
            await this.dataInfoManager.disposeAsync();

            if (this.ownCommunicator) {
                await this._communicator.disposeAsync();
            }

            this._communicator = undefined;
            this.messageHandlers = undefined;
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
        ownCommunicator?: boolean,
        proxyId?: string) {
        if (!Object.isObject(pathPattern)) {
            throw new Error("pathPattern must be provided.");
        }

        if (utils.isNullOrUndefined(communicator)) {
            throw new Error("communicator must be provided.");
        }

        this.id = proxyId || uuidv4();
        this._communicator = communicator;
        this.ownCommunicator = ownCommunicator === true;
        this.pathPattern = pathPattern;
        this.messageHandlers = Object.create(null);
        this.dataInfoManager = new DataInfoManager(new Delegation(this));
        this.initializeMessageHandlers();

        this.communicator.map(this.pathPattern, this.onMessage);
    }

    private resolveAsync(name: string, ...extraArgs: Array<any>): Promise<any> {
        if (this.resolver) {
            return this.resolver(this, name, ...extraArgs);
        }

        return undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Proxy (${this.id}) already disposed.`);
        }
    }

    private initializeMessageHandlers() {
        this.messageHandlers[ProxyActionType.RequestResource] = this.onRequestResourceAsync;
        this.messageHandlers[ProxyActionType.Delegate] = this.onDelegateAsync;
    }

    private onMessage = (communicator, path, proxyMsg: IProxyMessage): Promise<any> => {
        if (!isProxyMessage(proxyMsg)) {
            // Log Error.
            return Promise.resolve();
        }

        const asyncRequestHandler = this.messageHandlers[proxyMsg.action];

        if (!asyncRequestHandler) {
            // Log Error.
            return Promise.resolve();
        }

        return asyncRequestHandler(communicator, path, proxyMsg);
    }

    private onDelegateAsync = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<any> => {
        switch (msg.delegateType) {
            case DelegationType.Apply:
                return this.onApplyAsync(communicator, path, msg);

            case DelegationType.Dispose:
                return this.onDisposeAsync(communicator, path, msg);

            case DelegationType.GetProperty:
                return this.onGetPropertyAsync(communicator, path, msg);

            case DelegationType.SetProperty:
                return this.onSetPropertyAsync(communicator, path, msg);

            default:
                throw new Error(`Unknown delegation type: ${msg.delegateType}`);
        }
    }

    private onGetPropertyAsync = async (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<any> => {
        const delegationMsg = <IPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        return this.dataInfoManager.referAsDataInfo(await target[delegationMsg.property], delegationMsg.refId);
    }

    private onSetPropertyAsync = async (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<any> => {
        const delegationMsg = <ISetPropertyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        target[delegationMsg.property] = this.dataInfoManager.realizeDataInfo(delegationMsg.value, delegationMsg.refId);

        return true;
    }

    private onApplyAsync = async (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<any> => {
        const delegationMsg = <IApplyDelegationMessage>msg.content;
        const target = this.dataInfoManager.get(delegationMsg.refId);

        if (target === undefined) {
            throw new Error(`Target (${delegationMsg.refId}) doesn't exist.`);
        }

        if (typeof target !== "function") {
            throw new Error(`Target (${delegationMsg.refId}) is not a function which cannot be applied.`);
        }

        const result =
            await target.call(
                this.dataInfoManager.realizeDataInfo(delegationMsg.thisArg, delegationMsg.refId),
                ...delegationMsg.args.map((item) => this.dataInfoManager.realizeDataInfo(item, delegationMsg.refId)));

        return this.dataInfoManager.referAsDataInfo(result, delegationMsg.refId);
    }

    private onDisposeAsync = (communicator: ICommunicator, path: string, msg: IDelegationProxyMessage): Promise<void> => {
        const delegationMsg = <IDisposeDelegateMessage>msg.content;

        return this.dataInfoManager.releaseByIdAsync(delegationMsg.refId, delegationMsg.parentId, true);
    }

    private onRequestResourceAsync = async (communicator: ICommunicator, path: string, msg: IRequestResourceProxyMessage): Promise<IDataInfo> => {
        const tempReferer = this.dataInfoManager.referAsDataInfo(() => undefined);
        const extraArgs = msg.extraArgs.map((argDataInfo) => this.dataInfoManager.realizeDataInfo(argDataInfo, tempReferer.id));

        const target = await this.resolveAsync(msg.resourceId, ...extraArgs);
        const targetDataInfo = this.dataInfoManager.referAsDataInfo(target);

        if (targetDataInfo.id) {
            msg.extraArgs.forEach((argDataInfo) => {
                if (argDataInfo.id) {
                    this.dataInfoManager.addReferenceById(argDataInfo.id, targetDataInfo.id);
                }
            });
        }

        await this.dataInfoManager.releaseByIdAsync(tempReferer.id);

        return targetDataInfo;
    }
}
