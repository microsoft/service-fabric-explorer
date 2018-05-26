//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

import { ReferenceNode } from "./reference-node";

enum ActionType {
    RequestResource = "RequestResource",
    ReleaseResource = "ReleaseResource",

    GetProperty = "Get",
    SetProperty = "Set",
    Apply = "Apply"
}

interface IProxyMessage {
    action: ActionType;
}

interface IReleaseResourceProxyMessage extends IProxyMessage {
    action: ActionType.ReleaseResource;
    resourceId: string;
}

interface IRequestResourceProxyMessage extends IProxyMessage {
    action: ActionType.RequestResource;
    resourceId: string;
    extraArgs?: IArrayDataInfo;
}

interface IPropertyProxyMessage extends IProxyMessage {
    property: string | number;
}

interface IGetPropertyProxyMessage extends IPropertyProxyMessage {
    action: ActionType.GetProperty;
}

interface ISetPropertyProxyMessage extends IPropertyProxyMessage {
    action: ActionType.SetProperty;
    value: IDataInfo;
}

interface IApplyProxyMessage extends IProxyMessage {
    action: ActionType.Apply;
    thisArg: IDataInfo;
    args: IArrayDataInfo;
}



function dataTypeOf(data: any, treatArrayAsObject: boolean = false): DataType {
    const sysType = typeof data;

    switch (sysType) {
        case DataType.Object:
            if (data === null) {
                return DataType.Null;
            } else if (Array.isArray(data) && !treatArrayAsObject) {
                return DataType.Array;
            } else {
                return DataType.Object;
            }

        default:
            return <DataType>sysType;
    }
}

function isDataInfo(dataInfo: any): dataInfo is IDataInfo {
    return !utils.isNullOrUndefined(dataInfo)
        && !String.isNullUndefinedOrEmpty(dataInfo.type)
        && Object.values(DataType).findIndex((value) => value === dataInfo.type) >= 0;
}

function isProxyMessage(msg: any): msg is IProxyMessage {
    return !utils.isNullOrUndefined(msg)
        && 0 <= Object.values(ActionType).findIndex((type) => type === msg.action)
        && !String.isNullUndefinedOrWhitespace(msg.resourceId);
}

function flattenArrayDataInfo(arrayDataInfo: IArrayDataInfo): IArrayDataInfo {
    const flattenArray: IArrayDataInfo = {
        type: DataType.Array,
        value: new Array<IDataInfo>()
    };

    arrayDataInfo.value.forEach(itemDataInfo => {
        if (itemDataInfo.type === DataType.Array) {
            flattenArray.value.push(...flattenArrayDataInfo(<IArrayDataInfo>itemDataInfo).value);
        } else {
            flattenArray.value.push(itemDataInfo);
        }
    });

    return flattenArray;
}

class RemotingProxy implements IRemotingProxy {
    private readonly _id: string;

    private readonly autoDisposeCommunicator: boolean;

    private readonly path: string;

    private readonly symbol_resourceId: symbol;

    private referenceRoot: ReferenceNode;

    private resolver: Resolver;

    private communicator: ICommunicator;

    public get id(): string {
        return this._id;
    }

    public async requestAsync<T extends (Object & IDisposable) | (Function & IDisposable)>(identifier: string, ...extraArgs: any[]): Promise<T> {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(identifier)) {
            throw error("identifier must be supplied but not empty/whitespaces.");
        }

        const requestProxyMsg: IRequestResourceProxyMessage = {
            action: ActionType.RequestResource,
            resourceId: identifier
        };

        if (Array.isArray(extraArgs) && extraArgs.length > 0) {
            requestProxyMsg.extraArgs = <IArrayDataInfo>this.toDataInfo(extraArgs, false);
        }

        return this.realizeDataInfo(await this.sendAsync<IRequestResourceProxyMessage, IDataInfo>(requestProxyMsg));
    }

    public setResolver(resolver: Resolver): void {
        this.validateDisposal();

        if (!utils.isNullOrUndefined(resolver) && !Function.isFunction(resolver)) {
            throw error("resolver must be a function.");
        }

        this.resolver = resolver;
    }

    public getResolver(): Resolver {
        this.validateDisposal();

        return this.resolver;
    }

    public get disposed(): boolean {
        return this.resourceMap === undefined;
    }

    public async dispose(): Promise<void> {
        if (!this.disposed) {
            await Promise.all(Object.values(this.resourceMap).map(async (record) => {
                await utils.disposeAsync(record.data);
                await Promise.all(record.children.map((id) => this.releaseAsync(id)));
            }));

            this.communicator.unmap(this.path);

            if (this.autoDisposeCommunicator) {
                await this.communicator.dispose();
            }
        }

        this.communicator = undefined;
        this.resolver = undefined;
    }

    constructor(
        ipcUtilities: IIpcUtilities,
        communicator: ICommunicator,
        resolver?: Resolver,
        path: string = "remoting",
        id?: string,
        audoDisposeCommunicator: boolean = true) {

        if (!ipcUtilities.isCommunicator(communicator)) {
            throw error("communicator must implement ICommunicator interface.");
        }

        if (String.isNullUndefinedOrWhitespace(path)) {
            throw error("path cannot be null/undefined/empty/whitespaces.");
        }

        this.symbol_resourceId = Symbol("ResourceId");
        this._id = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
        this.referenceRoot = ReferenceRecord.createRoot();
        this.path = path;
        this.communicator = communicator;
        this.autoDisposeCommunicator = audoDisposeCommunicator;
        this.setResolver(resolver);

        this.communicator.map(path, this.onMessage);
    }

    private sendAsync<TMsg extends IProxyMessage, TResponse>(msg: TMsg): Promise<TResponse> {
        return this.communicator.sendAsync(this.path, msg);
    }

    private onMessage = (communicator, path, content) => {
        this.validateDisposal();

        if (!isProxyMessage(content)) {
            // Log if necessary.
            return;
        }

        switch (content.action) {
            case ActionType.RequestResource:
                return this.onRequestResource(content);

            case ActionType.ReleaseResource:
                return this.onReleaseResource(content);

            case ActionType.GetProperty:
                return this.onGetProperty(<IGetPropertyProxyMessage>content);

            case ActionType.SetProperty:
                return this.onSetProperty(<ISetPropertyProxyMessage>content);

            case ActionType.Apply:
                return this.onApply(<IApplyProxyMessage>content);

            default:
                throw error("Unknown action ({}) on resource ({}).", content.action, content.resourceId);
        }
    }

    private async sendActionGetPropertyAsync(id: string, property: string | number): Promise<any> {
        return this.realizeDataInfo(
            await this.sendAsync<IGetPropertyProxyMessage, IDataInfo>({
                action: ActionType.GetProperty,
                resourceId: id,
                property: property
            }));
    }

    private async sendActionSetPropertyAsync(id: string, property: string | number, value: any): Promise<boolean> {
        return this.realizeDataInfo(
            await this.sendAsync<ISetPropertyProxyMessage, IDataInfo>({
                action: ActionType.SetProperty,
                resourceId: id,
                property: property,
                value: this.toDataInfo(value)
            }));
    }

    private async sendActionApplyAsync(id: string, thisArg: any, args: Array<any>): Promise<any> {
        return this.realizeDataInfo(
            await this.sendAsync<IApplyProxyMessage, IDataInfo>({
                action: ActionType.Apply,
                resourceId: id,
                thisArg: this.toDataInfo(thisArg, false),
                args: <IArrayDataInfo>this.toDataInfo(args)
            }));
    }

    private generateObjectProxy(id: string, schema: ISchema): Object {
        const record = this.getResourceRecord(id);

        if (record !== undefined) {
            return record.data;
        }

        const target: Object = {
            [this.symbol_resourceId]: id,
            then: undefined,
            catch: undefined,
            finally: undefined,
            toJSON: undefined
        };

        Object.markSerializable(target, false);
        Object.keys(schema).forEach(propertyName => {
            const propertyDescriptor = schema[propertyName];

            Object.defineProperty(target, propertyName,
                {
                    enumerable: propertyDescriptor.enumerable,
                    configurable: propertyDescriptor.configurable,
                    writable: propertyDescriptor.writable,
                    value: this.generateFunctionProxy(propertyDescriptor.dataInfo.value)
                });
        });

        if ("dispose" in target) {
            const disposeAsyncFunc = target["dispose"];
            target["dispose"] = async () => {
                await disposeAsyncFunc();
                await this.releaseAsync(id);
            };
        } else {
            target["dispose"] = () => this.releaseAsync(id);
        }

        return new Proxy(target, {
            get: (target, property) => {
                if (property in target) {
                    return target[property];
                } else if (String.isString(property) || Number.isNumber(property)) {
                    return this.sendActionGetPropertyAsync(id, property);
                } else {
                    return target[property];
                }
            },
            set: (target, property, value) => {
                if (property in target) {
                    throw error("Cannot change function property ({}) of the object ({}).", property, id);
                } else if (String.isString(property) || Number.isNumber(property)) {
                    this.sendActionSetPropertyAsync(id, property, value);
                } else {
                    target[property] = value;
                }

                return true;
            }
        });
    }

    private generateFunctionProxy(id: string): Function {
        const record = this.getResourceRecord(id);

        if (record !== undefined) {
            return <Function>record.data;
        }

        const targetFunc: Function = () => undefined;

        targetFunc[this.symbol_resourceId] = id;

        return new Proxy(targetFunc, {
            apply: (target, thisArg, args) => this.sendActionApplyAsync(id, thisArg, args)
        });
    }

    private realizeDataInfo(dataInfo: IDataInfo): any {
        if (utils.isNullOrUndefined(dataInfo)) {
            return undefined;
        }

        switch (dataInfo.type) {
            case DataType.Array:
                if (!Array.isArray(dataInfo.value)) {
                    throw error("Invalid data format: the value of the IDataInfo with type, DataType.Array, must be an array of IDataInfo.");
                }

                const dataArray = new Array<any>();
                dataInfo.value.forEach((itemDataInfo) => dataArray.push(this.realizeDataInfo(itemDataInfo)));
                return dataArray;

            case DataType.Function:
                const funcRecord = this.getResourceRecord(dataInfo.value);

                if (funcRecord !== undefined) {
                    return funcRecord.data;
                }

                return this.generateFunctionProxy(dataInfo.value);

            case DataType.Object:
                if (String.isString(dataInfo.value)) {
                    const objectRecord = this.getResourceRecord(dataInfo.value);

                    if (objectRecord !== undefined) {
                        return objectRecord.data;
                    }

                    return this.generateObjectProxy(dataInfo.value, dataInfo.schema);
                } else {
                    return Object.markSerializable(dataInfo.value);
                }

            default:
                return dataInfo.value;
        }
    }

    private generateSchema(obj: Object): ISchema {
        if (utils.isNullOrUndefined(obj)) {
            return undefined;
        }

        const schema: ISchema = {};

        while (obj !== Object.prototype) {
            const propertyDescriptors = Object.getOwnPropertyDescriptors(obj);
            Object.keys(propertyDescriptors).forEach((propertyName) => {
                const propertyDescriptor: PropertyDescriptor = propertyDescriptors[propertyName];
                const dataType = dataTypeOf(obj[propertyName]);

                if (dataType === DataType.Function
                    && !(propertyName in schema)
                    && propertyName !== "constructor"
                    && propertyDescriptor.enumerable !== true) {
                    schema[propertyName] = {
                        enumerable: propertyDescriptor.enumerable,
                        configurable: propertyDescriptor.configurable,
                        writable: propertyDescriptor.writable,
                        dataInfo: this.toDataInfo(obj[propertyName])
                    };
                }
            });

            obj = Object.getPrototypeOf(obj);
        }

        return schema;
    }

    /**
     * Convert the data into IDataInfo.
     * @param {any} data the data to be converted to IDataInfo.
     * @param {boolean} [wrapRemoteResource=true] Indicates whether to wrap the remote resources into local resources and host locally. By default, it's true.
     */
    private toDataInfo(data: any, wrapRemoteResource: boolean = true, treatArrayAsObject: boolean = false): IDataInfo {
        const dataType = dataTypeOf(data, treatArrayAsObject);

        if (wrapRemoteResource !== true
            && dataType !== DataType.Undefined
            && dataType !== DataType.Null
            && data[this.symbol_resourceId] !== undefined) {
            return {
                type: dataType,
                value: data[this.symbol_resourceId]
            };
        }

        switch (dataType) {
            case DataType.Array:
                const dataArray: Array<any> = data;
                return {
                    type: dataType,
                    value: dataArray.map((dataItem) => this.toDataInfo(dataItem))
                };

            case DataType.Function:
                const funcRecord = this.newResourceRecord(data);

                return {
                    type: dataType,
                    value: funcRecord.id
                };

            case DataType.Object:
                if (!Object.isSerializable(data)) {
                    const objRecord = this.newResourceRecord(data);

                    return {
                        type: dataType,
                        value: objRecord.id,
                        schema: this.generateSchema(data)
                    };
                } else {
                    return {
                        type: dataType,
                        value: data
                    };
                }

            default:
                return {
                    type: dataType,
                    value: data
                };
        }
    }

    private newResourceRecord(data?: Object | Function): IResourceRecord {
        const record: IResourceRecord = {
            id: uuidv4(),
            data: data,
            children: new Array<string>()
        };

        this.resourceMap[record.id] = record;

        return record;
    }

    private getResourceRecord(resourceId: string): IResourceRecord {
        if (String.isNullUndefinedOrWhitespace(resourceId)) {
            return undefined;
        }

        return this.resourceMap[resourceId];
    }

    private removeResourceRecord(resourceId: string): IResourceRecord {
        const record = this.getResourceRecord(resourceId);

        if (record !== undefined) {
            delete this.resourceMap[resourceId];
        }

        return record;
    }

    private getReferenceIds(references: IArrayDataInfo): Array<string> {
        return flattenArrayDataInfo(references).value
            .filter((itemDataInfo) => itemDataInfo.type === DataType.Function || (itemDataInfo.type === DataType.Object && String.isString(itemDataInfo.value)))
            .map((itemDataInfo) => <string>itemDataInfo.value)
            .filter((refId) => this.getResourceRecord(refId) === undefined);
    }

    private holdReferences(referencerId: string, references: IArrayDataInfo): void {
        if (utils.isNullOrUndefined(references)) {
            return;
        }

        const refIdArray: Array<string> = this.getReferenceIds(references);
        const referencer = this.getResourceRecord(referencerId);

        if (referencer === undefined) {
            throw error("referencerId ({}) doesn't exist.", referencerId);
        }

        referencer.children.push(...refIdArray);
    }

    private async releaseReferencesAsync(references: IArrayDataInfo): Promise<void> {
        if (utils.isNullOrUndefined(references)) {
            return;
        }

        const refIdArray: Array<string> = this.getReferenceIds(references);

        await Promise.all(refIdArray.map((refId) => this.releaseAsync(refId)));
    }

    private async onRequestResource(msg: IProxyMessage): Promise<IDataInfo> {
        if (utils.isNullOrUndefined(this.resolver)) {
            throw error("Unable to resolve resource ({}) as resolver is not supplied.", msg.resourceId);
        }

        const requestMsg = <IRequestResourceProxyMessage>msg;
        const extraArgs = this.realizeDataInfo(requestMsg.extraArgs);
        const data = this.resolver(msg.resourceId, extraArgs);
        let dataInfo: IDataInfo;

        if (Array.isArray(extraArgs)) {
            if (Object.isSerializable(data)) {
                await this.releaseReferencesAsync(requestMsg.extraArgs);
            } else {
                dataInfo = this.toDataInfo(data, true, true);
                this.holdReferences(dataInfo.value, requestMsg.extraArgs);
            }
        }

        if (dataInfo === undefined) {
            dataInfo = this.toDataInfo(data);
        }

        return dataInfo;
    }

    private async onReleaseResource(msg: IProxyMessage): Promise<void> {
        const record = this.removeResourceRecord(msg.resourceId);

        if (record === undefined) {
            return;
        }

        await utils.disposeAsync(record.data);
        await Promise.all(record.children.map((id) => this.releaseAsync(id)));
    }

    private onGetProperty(msg: IGetPropertyProxyMessage): IDataInfo {
        const record = this.getResourceRecord(msg.resourceId);

        if (record === undefined) {
            throw error("Resource ({}) doesn't exist on proxy ({}).", msg.resourceId, this.id);
        }

        return this.toDataInfo(record.data[msg.property]);
    }

    private onSetProperty(msg: ISetPropertyProxyMessage): IDataInfo {
        const record = this.getResourceRecord(msg.resourceId);

        if (record === undefined) {
            throw error("Resource ({}) doesn't exist on proxy ({}).", msg.resourceId, this.id);
        }

        record.data[msg.property] = this.realizeDataInfo(msg.value);
        return DataInfos.True;
    }

    private async onApply(msg: IApplyProxyMessage): Promise<IDataInfo> {
        const record = this.getResourceRecord(msg.resourceId);

        if (record === undefined) {
            throw error("Resource ({}) doesn't exist on proxy ({}).", msg.resourceId, this.id);
        }

        const func: Function = <Function>record.data;
        const thisArg = this.realizeDataInfo(msg.thisArg);
        const args: Array<any> = this.realizeDataInfo(msg.args);
        const result = await func.apply(thisArg, args);

        const refArgs: IArrayDataInfo = {
            type: DataType.Array,
            value: new Array<IDataInfo>()
        };

        if (!utils.isNullOrUndefined(thisArg)) {
            refArgs.value.push(thisArg);
        }

        if (Array.isArray(args)) {
            refArgs.value.push(...args);
        }

        let resultDataInfo: IDataInfo;

        if (refArgs.value.length > 0) {
            if (Object.isSerializable(result)) {
                await this.releaseReferencesAsync(refArgs);
            } else {
                resultDataInfo = this.toDataInfo(result, true, true);
                this.holdReferences(resultDataInfo.value, refArgs);
            }
        }

        if (resultDataInfo === undefined) {
            resultDataInfo = this.toDataInfo(result);
        }

        return resultDataInfo;
    }

    private releaseAsync(id: string): Promise<void> {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(id)) {
            throw error("id must be supplied but not empty/whitespaces.");
        }

        return this.communicator.sendAsync(this.path, <IProxyMessage>{
            resourceId: id,
            action: ActionType.ReleaseResource
        });
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw error("Proxy ({}) already disposed.", this.id);
        }
    }
}

class TestProxy implements IRemotingProxy {
    public readonly id: string;

    private resolver: Resolver;

    private messageHandlers: IDictionary<RequestHandler>;

    private referenceRoot: ReferenceNode;

    constructor() {
        this.messageHandlers = {};
        this.referenceRoot = ReferenceNode.createRoot();
    }

    public requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: any[]): Promise<T> {
        this.validateDisposal();
        
        
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
        return !this.messageHandlers || !this.referenceRoot;
    }

    public dispose(): void | Promise<void> {
        this.referenceRoot = undefined;
        this.messageHandlers = undefined;
    }

    private resolve(name: string, ...extraArgs: Array<any>): any | Promise<any> {
        if (this.resolver) {
            return this.resolver(name, ...extraArgs);
        }

        return undefined;
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw error("Proxy ({}) already disposed.", this.id);
        }
    }

    private initializeMessageHandlers() {
        this.messageHandlers[ActionType.RequestResource] = this.onRequestResource;
        this.messageHandlers[ActionType.ReleaseResource] = this.onReleaseResource;
    }

    private onMessage = (communicator, path, proxyMsg: IProxyMessage) => {
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

    private onRequestResource = (communicator, path, msg: IRequestResourceProxyMessage) => {
        
    }

    private onReleaseResource = (communicator, path, msg: IReleaseResourceProxyMessage) => {

    }
}