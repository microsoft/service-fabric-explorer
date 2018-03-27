//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import { isCommunicator, DataType, IDataInfo, IActionInfo, isActionInfo, ActionType, ISetActionInfo, IGetActionInfo, IApplyActionInfo, toDataInfo } from "./common";
import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";
import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ResourceRecord implements IDisposable {
    private masterList: IDictionary<ResourceRecord>;

    public parent: ResourceRecord;

    public children: IDictionary<ResourceRecord>;

    public readonly id: string;

    public readonly type: DataType;

    public data: any;

    constructor(masterList: IDictionary<ResourceRecord>, parent: ResourceRecord, dataInfo: IDataInfo, data: any) {
        if (utils.isNullOrUndefined(masterList)) {
            throw error("masterList must be supplied.");
        }

        if (utils.isNullOrUndefined(dataInfo)) {
            this.id = uuidv4();
            this.data = data;
            this.type = <DataType>typeof data;
        }
        else {
            if (dataInfo.type !== DataType.Object && dataInfo.type !== DataType.Function) {
                throw error("Only Function and Object are recordable.");
            }

            this.id = dataInfo.data;
            this.data = new Proxy({}, {});
            this.type = dataInfo.type;
        }

        this.masterList = masterList;
        this.children = {};
        this.parent = undefined;

        if (!utils.isNullOrUndefined(parent)) {
            this.parent = parent;
            this.parent.children[this.id] = this;
        }

        this.masterList[this.id] = this;
    }

    public get disposed(): boolean {
        return this.masterList === undefined;
    }

    public dispose(): void {
        if (!this.disposed) {
            delete this.masterList[this.id];

            if (this.parent != undefined) {
                delete this.parent.children[this.id];
            }
        }

        this.children = undefined;
        this.parent = undefined;
        this.masterList = undefined;
        this.data = undefined;
    }

    public toDataInfo(): IDataInfo {
        return {
            type: this.type,
            data: this.id
        };
    }
}

class NodeProxy implements IProxy {
    private readonly proxyId: string;

    private readonly autoDisposeCommunicator: boolean;

    private communicator: ICommunicator;

    private resourceMap: IDictionary<ResourceRecord>;

    private resolver: Resolver;

    public get id(): string {
        return this.proxyId;
    }

    private onMessageAsync: RequestHandler = (communicator, path, content) => {
        if (isActionInfo(content)) {
            switch (content.action) {
                case ActionType.Get:

                    break;

                case ActionType.Set:
                    const setActionInfo = <ISetActionInfo>content;

                    break;

                default:
                    throw error("Unsupported action, {}.", content.action);
            }
        }
    };

    private async GetResourceRecord(id: string, extraArgs: Array<any>): Promise<ResourceRecord> {
        const resourceRecord = this.resourceMap[actionInfo.id];

        if (utils.isNullOrUndefined(resourceRecord)){
            await this.resolver()
        }

        return resourceRecord;
    }

    private async onGetActionInfoAsync(actionInfo: IGetActionInfo): Promise<IDataInfo> {
        const resourceRecord = this.resourceMap[actionInfo.id];

        if (utils.isNullOrUndefined(resourceRecord)) {
            throw error("No resource found for id:{}.", actionInfo.id);
        }
        else if (utils.isNullOrUndefined(actionInfo.propertyName)) {
            return resourceRecord.toDataInfo();
        }
        else if (resourceRecord.type === DataType.Object) {
            const dataInfo = toDataInfo(resourceRecord.data[actionInfo.propertyName]);

            
        }
        else {
            throw error("")
        }
    }

    private onSetActionInfoAsync(actionInfo: ISetActionInfo): Promise<IDataInfo> {
    }

    private onApplyActionInfoAsync(actionInfo: IApplyActionInfo): Promise<IDataInfo> {

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
        this.resourceMap = {};

        this.communicator.map(
            new RegExp("^" + escapeRegex(this.id) + "$", "gi"),
            this.onMessageAsync);
    }

    public get disposed(): boolean {
        throw new Error("Method not implemented.");
    }

    public requestAsync<T extends IDisposable>(name: string, ...extraArgs: any[]): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public setResolver(resolver: Resolver): void {
        throw new Error("Method not implemented.");
    }

    public getResolver(): Resolver {
        throw new Error("Method not implemented.");
    }

    public dispose(): void {
        throw new Error("Method not implemented.");
    }
}
