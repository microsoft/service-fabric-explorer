//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import { isCommunicator, ObjectSchema, PathBasedRequestHandlerDelegate } from "./common";
import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";
import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

enum ProxyActionType {
    RequestObjectByName = "RequestObjectByName",
    RequestObjectById = "RequestObjectById",
    ReleaseObject = "ReleaseObject"
}

enum ObjectActionType {
    Get = "Get",
    Set = "Set",
    Call = "Call"
}

interface INodeProxyMessage<TContent> {
    action: ProxyActionType;
    identifier: string;
    content?: TContent;
}

interface INodeProxyObjectMessage<TContent> {
    action: ObjectActionType;
    objectId: string;
    propertyName: string;
    content?: TContent;
}

interface IObjectRecord {
    id: string;
    object: any;
    schema: ObjectSchema;
}

function isNodeProxyMessage(msg: any): msg is INodeProxyMessage<any> {
    return !utils.isNullOrUndefined(msg)
        && !String.isNullUndefinedOrWhitespace(msg.action)
        && !String.isNullUndefinedOrWhitespace(msg.identifier);
}

function isNodeProxyObjectMessage(msg: any): msg is INodeProxyObjectMessage<any> {
    return !utils.isNullOrUndefined(msg)
        && !String.isNullUndefinedOrWhitespace(msg.action)
        && !String.isNullUndefinedOrWhitespace(msg.objectId)
        && !String.isNullUndefinedOrWhitespace(msg.propertyName);
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class NodeProxy implements IProxy {
    private readonly proxyId: string;

    private readonly autoDisposeCommunicator: boolean;

    private communicator: ICommunicator;

    public get id(): string {
        return this.proxyId;
    }

    private onProxyMessage: RequestHandler = (communicator, path, content) => {
        if (isNodeProxyMessage(content)) {
            switch (content.action) {
                case ProxyActionType.RequestObjectById:
                    return this.onRequestObjectById(content);

                case ProxyActionType.RequestObjectByName:
                    return this.onRequestObjectByName(content);

                default:
                    return;
            }
        }
    };

    private onRequestObjectById(msg: INodeProxyMessage): any {

    }

    private onRequestObjectByName(msg: INodeProxyMessage): any {

    }

    private onReleaseObject(msg: INodeProxyMessage): any {

    }

    constructor(communicator: ICommunicator, objectResolver?: ObjectResolver, autoDisposeCommunicator: boolean = true, id?: string) {
        if (!isCommunicator(communicator)) {
            throw error("communicator must be supplied.");
        }

        if (!utils.isNullOrUndefined(objectResolver) && !Function.isFunction(objectResolver)) {
            throw error("objectResolver must be a function.");
        }

        this.autoDisposeCommunicator = autoDisposeCommunicator === true;
        this.proxyId = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
        this.communicator = communicator;

        this.communicator.map(
            new RegExp("^" + escapeRegex(this.id) + "$", "gi"),
            this.onProxyMessage);
    }

    public get disposed(): boolean {
        throw new Error("Method not implemented.");
    }

    public requestObjectByNameAsync<T>(name: string, ...extraArgs: any[]): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public requestObjectByIdAsync<T>(id: string): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public releaseObject(id: string): void {
        throw new Error("Method not implemented.");
    }

    public addObject(obj: Object): string {
        throw new Error("Method not implemented.");
    }

    public removeObject(obj: Object): void {
        throw new Error("Method not implemented.");
    }

    public removeObjectById(objId: string): Object {
        throw new Error("Method not implemented.");
    }

    public setObjectResolver(resolver: ObjectResolver): void {
        throw new Error("Method not implemented.");
    }

    public getObjectResolver(): ObjectResolver {
        throw new Error("Method not implemented.");
    }

    public dispose(): void {
        throw new Error("Method not implemented.");
    }
}
