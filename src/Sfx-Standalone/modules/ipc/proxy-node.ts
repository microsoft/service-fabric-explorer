//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import { isCommunicator, DataType, IDataInfo, IActionInfo, isActionInfo, ActionType, ISetActionInfo, IGetActionInfo, IApplyActionInfo, toDataInfo, dataType } from "./common";
import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";
import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

enum ManagementActionType {
    RequestResource = "RequestResource",
    ReleaseResource = "ReleaseResource"
}

interface IResourceManagementMessage {
    action: ManagementActionType;
    identifier: string;
    data?: IDataInfo;
}

interface IResourceRecord {
    dataInfo: IDataInfo;
    data: Object | Function;
    childIds: Array<string>;
}

class DataSymbols {
    public readonly id: symbol;
    public readonly type: symbol;

    constructor() {
        this.id = Symbol("id");
        this.type = Symbol("type");
    }
}

interface IActionProxy {
    getAsync(id: string, property: string): Promise<any>;
    setAsync(id: string, property: string, value: any): Promise<boolean>;
    applyAsync(id: string, thisArg: any, args: Array<any>): Promise<any>;
}

function isResourceManagementMessage(msg: any): msg is IResourceManagementMessage {
    return !utils.isNullOrUndefined(msg)
        && Object.values(ManagementActionType).findIndex((action) => action === msg.action) >= 0
        && !String.isNullUndefinedOrWhitespace(msg.identifier);
}

class ResourceManager {
    private resourceMap: IDictionary<IResourceRecord>;
    private readonly symbols: DataSymbols;

    constructor(symbols: DataSymbols) {
        this.resourceMap = {};
        this.symbols = symbols;
    }

    public get(id: string): IResourceRecord {
        return this.resourceMap[id];
    }

    public addIfAbsent(dataInfo: IDataInfo, data: Object | Function, parentId?: string): void {
        if (dataInfo.type !== DataType.Object && dataInfo.type !== DataType.Function) {
            throw error("Only DataType.Object and DataType.Function are managable.");
        }

        if (dataInfo.data in this.resourceMap) {
            return;
        }

        if (!utils.isNullOrUndefined(parentId)) {
            let parentRecord = this.resourceMap[parentId];

            if (parentRecord === undefined) {
                parentRecord = {
                    dataInfo: undefined,
                    data: undefined,
                    childIds: []
                };
                this.resourceMap[parentId] = parentRecord;
            }

            parentRecord.childIds.push(dataInfo.data);
        }

        data[this.symbols.id] = dataInfo.data;
        data[this.symbols.type] = dataInfo.type;

        this.resourceMap[dataInfo.data] = {
            dataInfo: dataInfo,
            data: data,
            childIds: []
        };
    }

    public mergeChildren(sourceId: string, targetId: string): void {
        const sourceRecord = this.get(sourceId);
        let targetRecord = this.get(targetId);

        if (sourceRecord === undefined) {
            return;
        }

        if (targetRecord === undefined) {
            throw error("target ({}) doesn't exist.", targetId);
        }

        targetRecord.childIds.push(...sourceRecord.childIds);
        delete this.resourceMap[sourceId];
    }

    public async disposeAsync(id: string, skipDispose: boolean = false): Promise<void> {
        const record = this.resourceMap[id];

        if (record === undefined) {
            return;
        }

        record.childIds.forEach(async (childId) => await this.disposeAsync(childId));

        if (!skipDispose) {
            await utils.disposeAsync(record.data);
        }

        delete record.data[this.symbols.id];
        delete record.data[this.symbols.type];
        delete this.resourceMap[id];
    }

    public async disposeAllAsync(): Promise<void> {
        await Promise.all(Object.keys(this.resourceMap).map((id) => this.disposeAsync(id)));
    }
}

class NodeProxy implements IProxy, IActionProxy {
    private readonly proxyId: string;

    private readonly autoDisposeCommunicator: boolean;

    private readonly symbols: DataSymbols;

    private readonly path_resources: string;

    private communicator: ICommunicator;

    private resourceManager: ResourceManager;

    private resolver: Resolver;

    public get id(): string {
        return this.proxyId;
    }

    public get disposed(): boolean {
        return this.resourceManager === undefined;
    }

    constructor(communicator: ICommunicator, resolver?: Resolver, autoDisposeCommunicator: boolean = true, id?: string) {
        if (!isCommunicator(communicator)) {
            throw error("communicator must be supplied.");
        }

        if (!utils.isNullOrUndefined(resolver) && !Function.isFunction(resolver)) {
            throw error("objectResolver must be a function.");
        }

        this.autoDisposeCommunicator = autoDisposeCommunicator === true;
        this.proxyId = String.isNullUndefinedOrWhitespace(id) ? uuidv4() : id;
        this.communicator = communicator;
        this.symbols = new DataSymbols();
        this.resourceManager = new ResourceManager(this.symbols);
        this.path_resources = this.id + "/resources";

        this.communicator.map(
            this.id,
            this.onManagementMessageAsync);

        this.communicator.map(
            this.path_resources,
            this.onResourceMessageAsync);
    }
    
    public async requestAsync<T extends IDisposable>(identifier: string, ...extraArgs: Array<any>): Promise<T> {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(identifier)) {
            throw error("identifier must be supplied.");
        }

        let resourceRecord = this.resourceManager.get(identifier);

        if (resourceRecord !== undefined) {
            return <any>resourceRecord.data;
        }

        const dataInfo: IDataInfo =
            await this.communicator.sendAsync<IResourceManagementMessage, IDataInfo>(
                this.id,
                {
                    action: ManagementActionType.RequestResource,
                    identifier: identifier,
                    data: this.convertToDataInfo(extraArgs, identifier)
                });

        const data = this.realizeDataInfo(dataInfo);

        this.resourceManager.mergeChildren(identifier, dataInfo.data);
        return data;
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

    public async dispose(): Promise<void> {
        if (this.disposed) {
            return;
        }

        this.communicator.unmap(this.id);
        this.communicator.unmap(this.path_resources);

        await this.resourceManager.disposeAllAsync();
        this.resourceManager = undefined;
    }

    public async getAsync(id: string, property: PropertyKey): Promise<any> {
        const dataInfo = await this.communicator.sendAsync<IGetActionInfo, IDataInfo>(
            this.path_resources,
            {
                action: ActionType.Get,
                id: id,
                propertyName: <string>property
            });

        return this.realizeDataInfo(dataInfo, id);
    }

    public async setAsync(id: string, property: PropertyKey, value: any): Promise<boolean> {
        const dataInfo = await this.communicator.sendAsync<ISetActionInfo, IDataInfo>(
            this.path_resources,
            {
                action: ActionType.Set,
                id: id,
                propertyName: <string>property,
                data: this.convertToDataInfo(value, id)
            });

        return this.realizeDataInfo(dataInfo, id);
    }

    public async applyAsync(id: string, thisArg: any, args: Array<any>): Promise<any> {
        let thisArgDataInfo: IDataInfo = undefined;

        if (!utils.isNullOrUndefined(thisArg) && thisArg[this.symbols.id] !== undefined) {
            thisArgDataInfo = {
                type: thisArg[this.symbols.type],
                data: thisArg[this.symbols.id]
            };
        }

        if (thisArgDataInfo === undefined) {
            thisArgDataInfo = this.convertToDataInfo(thisArg, id);
        }

        const dataInfo = await this.communicator.sendAsync<IApplyActionInfo, IDataInfo>(
            this.path_resources,
            {
                action: ActionType.Apply,
                id: id,
                data: {
                    thisArg: thisArgDataInfo,
                    args: args.map((arg) => this.convertToDataInfo(arg, id))
                }
            });

        return this.realizeDataInfo(dataInfo, id);
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw error("Proxy ({}) already disposed.", this.id);
        }
    }

    private async releaseAsync(id: string): Promise<void> {
        if (this.disposed) {
            return;
        }

        await this.resourceManager.disposeAsync(id, true);
        await this.communicator.sendAsync(this.id, <IResourceManagementMessage>{
            action: ManagementActionType.ReleaseResource,
            identifier: id
        });
    }

    private generateObjectProxy(id: string): Object {
        const actionProxy: IActionProxy = this;

        return new Proxy({},
            {
                get: (target, property) => {
                    if (property === "dispose") {
                        return this.releaseAsync(id);
                    } else if (String.isString(property)) {
                        return actionProxy.getAsync(id, property);
                    } else {
                        return target[property];
                    }
                },
                set: (target, property, value) => {
                    if (String.isString(property)) {
                        actionProxy.setAsync(id, property, value);
                    } else {
                        target[property] = value;
                    }

                    return true;
                }
            });
    }

    private generateFunctionProxy(id: string): Function {
        const actionProxy: IActionProxy = this;

        return new Proxy(() => undefined,
            {
                apply: (target, thisArg, args) => actionProxy.applyAsync(id, thisArg, args)
            });
    }

    private realizeDataInfo(dataInfo: IDataInfo, parentId?: string): any {
        switch (dataInfo.type) {
            case DataType.Function:
                const functionProxy = this.generateFunctionProxy(dataInfo.data);
                this.resourceManager.addIfAbsent(dataInfo, functionProxy, parentId);
                return functionProxy;

            case DataType.Object:
                const objectProxy = this.generateFunctionProxy(dataInfo.data);
                this.resourceManager.addIfAbsent(dataInfo, objectProxy, parentId);
                return objectProxy;

            case DataType.Array:
                const dataInfoArray: Array<IDataInfo> = dataInfo.data;
                const dataArray: Array<any> = [];

                dataInfoArray.forEach(
                    (dataInfoItem: IDataInfo) =>
                        dataArray.push(this.realizeDataInfo(dataInfoItem, parentId)));
                return dataArray;

            default:
                return dataInfo.data;
        }
    }

    private convertToDataInfo(data: any, parentId?: string): IDataInfo {
        const dataInfo = toDataInfo(data);

        switch (dataInfo.type) {
            case DataType.Function:
            case DataType.Object:
                this.resourceManager.addIfAbsent(dataInfo, data, parentId);
                break;

            case DataType.Array:
                const dataArray: Array<any> = data;
                const dataInfoArray: Array<IDataInfo> = [];

                dataArray.forEach(
                    (dataItem) =>
                        dataInfoArray.push(this.convertToDataInfo(dataItem, parentId)));
                dataInfo.data = dataInfoArray;
                break;

            default:
                break;
        }

        return dataInfo;
    }

    private onManagementMessageAsync: RequestHandler = async (communicator, path, content) => {
        if (isResourceManagementMessage(content)) {
            switch (content.action) {
                case ManagementActionType.RequestResource:
                    let resourceRecord = this.resourceManager.get(content.identifier);

                    if (resourceRecord === undefined) {
                        if (utils.isNullOrUndefined(this.resolver)) {
                            throw error("unknown resource: {}", content.identifier);
                        }

                        const data = await this.resolver(content.identifier, this.realizeDataInfo(content.data, content.identifier));
                        const dataInfo = this.convertToDataInfo(data);

                        this.resourceManager.mergeChildren(content.identifier, dataInfo.data);
                        resourceRecord = this.resourceManager.get(dataInfo.data);
                    }

                    return resourceRecord.dataInfo;

                case ManagementActionType.ReleaseResource:
                    return this.resourceManager.disposeAsync(content.identifier);

                default:
                    throw error("unknown action: {}", content.action);
            }
        }
    }

    private onResourceMessageAsync: RequestHandler = (communicator, path, content) => {
        if (isActionInfo(content)) {
            switch (content.action) {
                case ActionType.Get:
                    return this.onResourceGetAsync(content);

                case ActionType.Set:
                    return this.onResourceSetAsync(content);

                case ActionType.Apply:
                    return this.onResourceApplyAsync(content);

                default:
                    throw error("Unsupported action, {}.", content.action);
            }
        }
    }

    private async onResourceGetAsync(actionInfo: IGetActionInfo): Promise<IDataInfo> {
        const resourceRecord = await this.resourceManager.get(actionInfo.id);

        if (resourceRecord === undefined) {
            throw error("Unknown resource ({}).", actionInfo.id);
        }

        if (utils.isNullOrUndefined(actionInfo.propertyName)) {
            throw error("The property name must be supplied. (Resource: {})", actionInfo.id);
        }

        if (resourceRecord.dataInfo.type !== DataType.Object) {
            throw error("Cannot get the property ({}) on a non-object data ({}).",
                actionInfo.propertyName,
                actionInfo.id);
        }

        const data = resourceRecord.data[actionInfo.propertyName];

        return this.convertToDataInfo(data, actionInfo.id);
    }

    private async onResourceSetAsync(actionInfo: ISetActionInfo): Promise<IDataInfo> {
        const resourceRecord = await this.resourceManager.get(actionInfo.id);

        if (resourceRecord === undefined) {
            throw error("Unknown resource ({}).", actionInfo.id);
        }

        if (utils.isNullOrUndefined(actionInfo.propertyName)) {
            throw error("The property name must be supplied. (Resource: {})", actionInfo.id);
        }

        if (resourceRecord.dataInfo.type !== DataType.Object) {
            throw error("Cannot set the property ({}) on a non-object data ({}).",
                actionInfo.propertyName,
                actionInfo.id);
        }

        resourceRecord.data[actionInfo.id] = this.realizeDataInfo(actionInfo.data, actionInfo.id);
        return this.convertToDataInfo(true, actionInfo.id);
    }

    private async onResourceApplyAsync(actionInfo: IApplyActionInfo): Promise<IDataInfo> {
        const resourceRecord = await this.resourceManager.get(actionInfo.id);

        if (resourceRecord === undefined) {
            throw error("Unknown resource ({}).", actionInfo.id);
        }

        if (resourceRecord.dataInfo.type !== DataType.Function) {
            throw error("Cannot apply on non-function data ({}).",
                actionInfo.id);
        }

        const func = <Function>resourceRecord.data;
        const thisArg = this.realizeDataInfo(actionInfo.data.thisArg, actionInfo.id);
        const args = this.realizeDataInfo({ type: DataType.Array, data: actionInfo.data.args }, actionInfo.id);
        const result = await func.apply(thisArg, args);

        return this.convertToDataInfo(result, actionInfo.id);
    }
}
