//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import { isCommunicator, ObjectSchema } from "./common";
import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

enum ActionType {
    RequestObjectByName = "RequestObjectByName",
    RequestObjectById = "RequestObjectById"
}

interface INodeProxyMessage {
    action: ActionType;
    identifier: string;
    content?: any;
}

interface IObjectRecord {
    id: string;
    object: any;
    schema: ObjectSchema;
}

function isNodeProxyMessage(msg: any): msg is INodeProxyMessage {
    return !utils.isNullOrUndefined(msg)
        && !String.isNullUndefinedOrWhitespace(msg.action)
        && !String.isNullUndefinedOrWhitespace(msg.identifier);
}

class NodeProxy implements IProxy {
    public readonly id: string;

    private readonly autoDisposeCommunicator: boolean;

    private communicator: ICommunicator;

    private objectResolver: ObjectResolver;

    private requestHandler: RequestHandler;

    private objectMap: IDictionary<IObjectRecord>;

    constructor(
        communicator: ICommunicator, 
        autoDisposeCommunicator: boolean = true, 
        objectResolver?: ObjectResolver, 
        id?: string) {

        if (!isCommunicator(communicator)) {
            throw error("communicator must be an object who implements ICommunicator.");
        }

        if (!utils.isNullOrUndefined(objectResolver) && !Function.isFunction(objectResolver)) {
            throw error("objectResolver must be a function.");
        }

        this.autoDisposeCommunicator = autoDisposeCommunicator === true;
        this.id = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
        this.objectResolver = objectResolver;
        this.communicator = communicator;
        this.objectMap = {};

        const nextHandler = this.communicator.getRequestHandler();
        this.requestHandler = (path, msg) => {
            if (path === this.id && isNodeProxyMessage(msg)) {
                switch (msg.identifier) {
                    case ActionType.RequestObjectById:
                        return this.onRequestObjectById(msg);

                    case ActionType.RequestObjectByName:
                        return this.onRequestObjectByName(msg);

                    default:
                        return;
                }
            }
            else if (!utils.isNullOrUndefined(nextHandler)) {
                return nextHandler(path, msg);
            }
        };
    }

    private onRequestObjectById(msg: INodeProxyMessage): INodeProxyMessage {
        const objectRecord = this.objectMap[msg.identifier];

        if (objectRecord === undefined) {
            throw error("Unknown object, {}.", msg.identifier);
        }

        return {
            action: msg.action,
            identifier: msg.identifier,
            content: objectRecord.schema
        };
    }

    private onRequestObjectByName(msg: INodeProxyMessage): INodeProxyMessage {
        if (utils.isNullOrUndefined(this.objectResolver)) {
            throw error("Unknown object, {}.", msg.identifier);
        }

        const extraArgs: Array<any> = Array.isArray(msg.content) ? msg.content : [];
        const object = this.objectResolver(msg.identifier, ...extraArgs);

        const objectRecord: IObjectRecord = {
            id: uuidv4(),
            schema: ObjectSchema.generateSchema(object),
            object: object
        }

        this.objectMap[objectRecord.id] = objectRecord;

        return {
            action: msg.action,
            identifier: objectRecord.id,
            content: objectRecord.schema
        };
    }

    private async requestObjectAsync<T>(actionType: ActionType, name: string, extraArgs?: Array<any>): Promise<T> {
        const proxyMsg = await this.communicator.sendAsync<INodeProxyMessage, INodeProxyMessage>(
            this.id,
            {
                action: actionType,
                identifier: name
            });

        if (extraArgs !== undefined) {
            proxyMsg.content = extraArgs;
        }

        const objectRecord: IObjectRecord = {
            id: proxyMsg.identifier,
            schema: proxyMsg.content,
            object: new Proxy({}, );
        };

        this.objectMap[objectRecord.id] = objectRecord;

        return Promise.resolve(objectRecord.object);
    }

    public async requestObjectByNameAsync<T>(name: string, ...extraArgs: Array<any>): Promise<T> {
        if (String.isNullUndefinedOrWhitespace(name)) {
            throw error("name must be supplied but not empty/whitespaces.");
        }

        return this.requestObjectAsync<T>(ActionType.RequestObjectByName, name, extraArgs);
    }

    public async requestObjectByIdAsync<T>(id: string): Promise<T> {
        if (String.isNullUndefinedOrWhitespace(id)) {
            throw error("id must be supplied but not empty/whitespaces.");
        }

        const objectRecord = this.objectMap[id];

        if (objectRecord === undefined) {
            return this.requestObjectAsync<T>(ActionType.RequestObjectById, id);
        }

        return Promise.resolve(objectRecord.object);
    }

    public setObjectResolver(resolver: ObjectResolver): void {
        if (!utils.isNullOrUndefined(resolver) && !Function.isFunction(resolver)) {
            throw error("resolver must be a function.");
        }

        this.objectResolver = resolver;
    }

    public getObjectResolver(): ObjectResolver {
        return this.objectResolver;
    }

    public dispose(): void {
        if (this.communicator !== undefined && this.autoDisposeCommunicator) {
            this.communicator.dispose();
        }

        this.objectResolver = undefined;
        this.communicator = undefined;
    }
}