//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import { ICommunicator, ISender, IProxy } from "../../@types/ipc";
import * as utils from "../../utilities/utils";
import { Disposable } from "./common";
import error from "../../utilities/errorUtil";

enum EventNames {
    // Actions
    requestObject = "request-object",
    pullProperty = "pull-property",
    pushProperty = "push-property",
    callProperty = "call-property",
    callFunction = "call-function",
    releaseObject = "release-object",

    // Status
    proxyConnected = "proxy-connected",
    proxyDisconnected = "proxy-disconnected",
}

enum VariableKind {
    function = "function",
    value = "value",
    error = "error"
}

interface IVariableInfo {
    kind: VariableKind;
    value?: any;
    enumerable?: boolean;
    writable?: boolean;
}

interface IObjectSchema extends IDictionary<IVariableInfo> {
}

interface IObjectItem {
    id: string;
    objectTypeId: string;
    instance: object;
    proxyId: string;
    associations: IDictionary<any>;
}

interface IObjectType {
    id: string;
    schema: IObjectSchema;
}

interface IObjectInfo {
    objectId: string;
    schema: IObjectSchema;
}

interface IPropertyRequest {
    objectId: string;
    propertyName: string;
    argInfos: Array<IVariableInfo>;
}

interface IFunctionRequest {
    objectId: string;
    functionId: string;
    argInfos: Array<IVariableInfo>;
}

const VariableInfos = {
    undefined: <IVariableInfo>{
        kind: VariableKind.value,
        value: undefined
    },

    error: (messageOrFormat: string, ...args: Array<any>): IVariableInfo => {
        return {
            kind: VariableKind.error,
            value: String.format(messageOrFormat, ...args)
        };
    },

    function: (fnId: string): IVariableInfo => {
        return {
            kind: VariableKind.function,
            value: fnId
        };
    },

    value: (value: any): IVariableInfo => {
        return {
            kind: VariableKind.value,
            value: value
        };
    }
};

function getPropertyDescriptors(obj: Object): IDictionary<PropertyDescriptor> {
    const propertyDescriptors: IDictionary<PropertyDescriptor> = {};
    let objPrototype: any = obj;

    do {
        const objPropertyDescriptors = Object.getOwnPropertyDescriptors(objPrototype);

        for (let propertyName in objPropertyDescriptors) {
            if (propertyDescriptors[propertyName] === undefined) {
                propertyDescriptors[propertyName] = objPropertyDescriptors[propertyName];
            }
        }

        objPrototype = Object.getPrototypeOf(obj);
    } while (objPrototype !== Object.prototype);

    return propertyDescriptors;
}

function generateObjectSchema(obj: object): IDictionary<IVariableInfo> {
    const schema: IDictionary<IVariableInfo> = {};
    const propertyDescriptors = getPropertyDescriptors(obj);

    Object.keys(propertyDescriptors).forEach((propertyName) => {
        const propertyDescriptor = propertyDescriptors[propertyName];
        let variableInfo: IVariableInfo;

        if (propertyDescriptor !== undefined) {
            if (propertyDescriptor.get !== undefined) {
                variableInfo = {
                    kind: VariableKind.value
                };
            } else {
                variableInfo = {
                    kind: Function.isFunction(propertyDescriptor.value) ? VariableKind.function : variableInfo.value
                };
            }
        } else {
            variableInfo = {
                kind: Function.isFunction(obj[propertyName]) ? VariableKind.function : variableInfo.value
            };
        }

        schema[propertyName] = variableInfo;
    });

    return schema;
}

export default class ElectronProxy extends Disposable implements IProxy {
    public id: string;

    private readonly autoclose: boolean;

    private readonly symbol_objectId: symbol;

    private readonly symbol_proxyId: symbol;

    private communicator: ICommunicator;

    private eventHandlerTable: IDictionary<Array<Function>>;

    private objectTable: IDictionary<IObjectItem>;

    private objectTypeTable: IDictionary<IObjectType>;

    private proxyTable: IDictionary<ISender>;

    constructor(communicator: ICommunicator, autoclose: boolean = false) {
        super();

        if (!Object.isObject(communicator)) {
            throw error("communicator must be supplied.");
        }

        this.objectTable = {};
        this.objectTypeTable = {};
        this.eventHandlerTable = {};
        this.id = uuidv4();
        this.communicator = communicator;
        this.proxyTable = this.communicator.isHost ? {} : undefined;
        this.autoclose = autoclose === true;

        this.communicator.on(EventNames.callFunction, this.onCallFunctionRequest);
        this.communicator.on(EventNames.callProperty, this.onCallPropertyRequest);
        this.communicator.on(EventNames.pullProperty, this.onPullRequest);
        this.communicator.on(EventNames.pushProperty, this.onPushRequest);
        this.communicator.on(EventNames.releaseObject, this.onReleaseObject);
        this.communicator.on(EventNames.requestObject, this.onRequestObject);

        this.communicator.on(EventNames.proxyConnected, this.onProxyConnected);
        this.communicator.on(EventNames.proxyDisconnected, this.onProxyDisconnected);

        if (!this.communicator.isHost) {
            this.communicator.send(EventNames.proxyConnected);
        }
    }

    public on(eventName: "resolve-object", handler: (objectIdentity: string, ...args: Array<any>) => object): void;
    public on(eventName: "proxy-connected", handler: (responser: ISender) => void): void;
    public on(eventName: "proxy-disconnected", handler: (responser: ISender) => void): void;
    public on(eventName: "resolve-object" | "proxy-connected" | "proxy-disconnected", handler: (...args: Array<any>) => any): void {
        this.validateDisposal();

        if (!Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        let handlers = this.eventHandlerTable[eventName];

        if (handlers === undefined) {
            this.eventHandlerTable[eventName] = handlers = new Array();
        }

        handlers.push(handler);
    }

    public removeListener(eventName: string, handler: Function): void {
        this.validateDisposal();

        if (!String.isString(eventName) || eventName.trim() === "") {
            throw error("eventName must be supplied.");
        }

        if (!Function.isFunction(handler)) {
            throw error("handler must be supplied and a function.");
        }

        const handlers = this.eventHandlerTable[eventName];

        if (handlers !== undefined) {
            const handlerIndex = handlers.indexOf(handler);

            if (handlers.indexOf(handler) >= 0) {
                handlers.splice(handlerIndex, 1);
            }

            if (handlers.length <= 0) {
                delete this.eventHandlerTable[eventName];
            }
        }
    }

    public requestObjectFromProxy<T extends Object>(proxyId: string, objectIdentity: string, ...args: Array<any>): T {
        this.validateDisposal();

        if (this.proxyTable === undefined && proxyId !== this.communicator.id) {
            throw error("Requesting an object from specific proxy is not supported.");
        }

        if (!String.isString(proxyId) || proxyId.trim() === "") {
            throw error("proxyId must be a string and supplied.");
        }

        if (!String.isString(objectIdentity) || objectIdentity.trim() === "") {
            throw error("objectIdentity must be a string and supplied.");
        }

        const proxy: ISender = this.proxyTable === undefined ? this.communicator : this.proxyTable[proxyId];

        if (proxy === undefined) {
            throw error("proxy, {}, doesn't exist.", proxyId);
        }

        const objectItem: IObjectItem = {
            id: uuidv4(),
            objectTypeId: objectIdentity,
            instance: undefined,
            proxyId: proxyId,
            associations: {}
        };

        this.objectTable[objectItem.id] = objectItem;

        let objectInfo: IObjectInfo = undefined;

        try {
            const resultInfo: IVariableInfo = proxy.sendSync(EventNames.requestObject, objectIdentity, objectItem.id, ...this.toArgInfos(proxy, objectItem.id, args));
            objectInfo = this.toArg(proxy, objectItem.id, resultInfo);

            if (objectInfo === undefined) {
                return undefined;
            }

            return this.toProxyObject(proxy, objectInfo);
        } finally {
            if (objectInfo === undefined) {
                delete this.objectTable[objectItem.id];
            }
        }
    }

    public requestObject<T extends object>(objectIdentity: string, ...args: Array<any>): T {
        return this.requestObjectFromProxy(this.communicator.id, objectIdentity, ...args);
    }

    public releaseObject(proxyObject: object): void {
        this.validateDisposal();

        if (!Object.isObject(proxyObject)) {
            return;
        }

        const proxy: ISender = this.proxyTable === undefined ? this.communicator : this.proxyTable[proxyObject[this.symbol_proxyId]];

        if (!utils.isNullOrUndefined(proxy)) {
            proxy.sendSync(EventNames.releaseObject, proxyObject[this.symbol_objectId]);
        }
    }

    protected disposing(): void {
        if (!this.communicator.isHost) {
            this.communicator.sendSync(EventNames.proxyDisconnected);
        } else {
            Object.values(this.proxyTable).forEach((proxy) => proxy.sendSync(EventNames.proxyDisconnected));
        }

        this.communicator = undefined;
        this.eventHandlerTable = undefined;
        this.proxyTable = undefined;
        this.objectTable = undefined;
        this.objectTypeTable = undefined;
    }

    private toProxyObject<T extends Object>(proxy: ISender, objectInfo: IObjectInfo): T {
        const proxyObject: T = <T>{};

        proxyObject[this.symbol_objectId] = objectInfo.objectId;
        proxyObject[this.symbol_proxyId] = proxy.id;

        Object.keys(objectInfo.schema).forEach((propertyName) => {
            const variableInfo = objectInfo.schema[propertyName];

            variableInfo.enumerable = utils.getEither(variableInfo.enumerable, variableInfo.kind !== VariableKind.function);
            variableInfo.writable = utils.getEither(variableInfo.writable, true);

            const propertyDescriptor: PropertyDescriptor = {
                enumerable: variableInfo.enumerable,
                configurable: false,
                writable: variableInfo.writable
            };

            if (variableInfo.kind === VariableKind.function) {
                propertyDescriptor.value = this.toDelegateCallPropertyFunction(proxy, objectInfo.objectId, propertyName);
            } else {
                propertyDescriptor.get = this.toDelegatePullPropertyFunction(proxy, objectInfo.objectId, propertyName);
                propertyDescriptor.set = propertyDescriptor.writable ? this.toDelegatePushPropertyFunction(proxy, objectInfo.objectId, propertyName) : undefined;
            }

            Object.defineProperty(proxyObject, propertyName, propertyDescriptor);
        });

        return proxyObject;
    }

    private triggerEvent(eventName: string, ...args: Array<any>): any {
        if (!String.isString(eventName)) {
            return;
        }

        const handlers = this.eventHandlerTable[eventName];

        if (handlers !== undefined) {
            let result: any;

            handlers.forEach((handler) => {
                try {
                    result = handler(...args);
                } catch (exception) {
                    // write error.
                }
            });

            return result;
        }
    }

    private readonly onRequestObject = (responser: ISender, objectIdentity: string, objectId: string, ...argInfos: Array<IVariableInfo>): IVariableInfo => {
        let obj = undefined;
        const objectItem: IObjectItem = {
            id: objectId,
            objectTypeId: objectIdentity,
            instance: undefined,
            proxyId: responser.id,
            associations: {}
        };

        this.objectTable[objectItem.id] = objectItem;

        try {
            obj = this.triggerEvent("resolve-object", objectIdentity, ...this.toArgs(responser, objectItem.id, argInfos));

            if (obj === undefined) {
                return VariableInfos.undefined;
            }

            objectItem.instance = obj;

            let objectType = this.objectTypeTable[objectIdentity];

            if (objectType === undefined) {
                this.objectTypeTable[objectIdentity] = objectType = {
                    id: objectIdentity,
                    schema: generateObjectSchema(obj)
                };
            }

            return VariableInfos.value({
                objectId: objectItem.id,
                schema: objectType.schema
            });
        } catch (exception) {
            if (exception instanceof Error) {
                return VariableInfos.error(exception.message);
            } else {
                return VariableInfos.error(exception.toString());
            }
        } finally {
            if (obj === undefined) {
                delete this.objectTable[objectItem.id];
            }
        }
    }

    private readonly onReleaseObject = (responser: ISender, objectId: string): boolean => {
        return delete this.objectTable[objectId];
    }

    private readonly onCallPropertyRequest = (responser: ISender, request: IPropertyRequest): IVariableInfo => {
        const objectItem = this.objectTable[request.objectId];

        if (objectItem === undefined) {
            return VariableInfos.error("object, {}, doesn't exist.", request.objectId);
        }

        try {
            const propertyFuction: Function = objectItem.instance[request.propertyName];
            const result = propertyFuction.apply(objectItem.instance, ...this.toArgs(responser, request.objectId, request.argInfos));

            return this.toArgInfo(responser, request.objectId, result);
        } catch (exception) {
            if (exception instanceof Error) {
                return VariableInfos.error(exception.message);
            } else {
                return VariableInfos.error(exception.toString());
            }
        }
    }

    private readonly onCallFunctionRequest = (responser: ISender, request: IFunctionRequest): IVariableInfo => {
        const objectItem = this.objectTable[request.objectId];

        if (objectItem === undefined) {
            return VariableInfos.error("object, {}, doesn't exist.", request.objectId);
        }

        const fn: Function = objectItem.associations[request.functionId];

        if (fn === undefined) {
            return VariableInfos.error("function, {}, under object, {}, deosn't exist.", request.functionId, request.objectId);
        }

        try {
            const result = fn(...this.toArgs(responser, request.objectId, request.argInfos));

            return this.toArgInfo(responser, request.objectId, result);
        } catch (exception) {
            if (exception instanceof Error) {
                return VariableInfos.error(exception.message);
            } else {
                return VariableInfos.error(exception.toString());
            }
        }
    }

    private readonly onPullRequest = (responser: ISender, request: IPropertyRequest): IVariableInfo => {
        const objectItem = this.objectTable[request.objectId];

        if (objectItem === undefined) {
            return VariableInfos.error("object, {}, doesn't exist.", request.objectId);
        }

        return this.toArgInfo(responser, objectItem.id, objectItem.instance[request.propertyName]);
    }

    private readonly onPushRequest = (responser: ISender, request: IPropertyRequest): IVariableInfo => {
        const objectItem = this.objectTable[request.objectId];

        if (objectItem === undefined) {
            return VariableInfos.error("object, {}, doesn't exist.", request.objectId);
        }

        try {
            objectItem.instance[request.propertyName] =
                this.toArg(
                    responser,
                    request.objectId,
                    request.argInfos.length <= 0 ? VariableInfos.undefined : request.argInfos[0]);
            return VariableInfos.undefined;
        } catch (exception) {
            if (exception instanceof Error) {
                return VariableInfos.error(exception.message);
            } else {
                return VariableInfos.error(exception.toString());
            }
        }
    }

    private readonly onProxyConnected = (responser: ISender): any => {
        // Write Info.
        this.proxyTable[responser.id] = responser;

        const result = this.triggerEvent("proxy-connected", responser);

        if (result !== undefined) {
            return result;
        }

        return null;
    }

    private readonly onProxyDisconnected = (responser: ISender): any => {
        const proxyId = responser.id;

        Object.values(this.objectTable).forEach((objectItem) => {
            if (proxyId === objectItem.proxyId) {
                delete this.objectTable[objectItem.id];
            }
        });

        const result = this.triggerEvent("proxy-disconnected", responser);

        if (!this.communicator.isHost) {
            this.dispose();
        }

        if (result !== undefined) {
            return result;
        }

        return null;
    }

    private toArg(proxy: ISender, objectId: string, argInfo: IVariableInfo): any {
        if (argInfo.kind === VariableKind.function) {
            return this.toDelegateFunction(proxy, objectId, argInfo.value);
        } else if (argInfo.kind === VariableKind.error) {
            throw new Error(argInfo.value);
        } else {
            return argInfo.value;
        }
    }

    private toArgs(proxy: ISender, objectId: string, argInfos: Array<IVariableInfo>): Array<any> {
        const args = new Array();

        argInfos.forEach((argInfo) => this.toArg(proxy, objectId, argInfo));

        return args;
    }

    private toArgInfo(proxy: ISender, objectId: string, value: any): IVariableInfo {
        if (Function.isFunction(value)) {
            return VariableInfos.function(this.toHostFunction(proxy, objectId, value));
        } else if (value instanceof Error) {
            return VariableInfos.error(value.message);
        } else {
            return VariableInfos.value(value);
        }
    }

    private toArgInfos(proxy: ISender, objectId: string, args: Array<any>): Array<IVariableInfo> {
        const argInfos = new Array();

        args.forEach((argValue) => args.push(this.toArgInfo(proxy, objectId, argValue)));

        return argInfos;
    }

    private toHostFunction(proxy: ISender, objectId: string, fn: Function): string {
        const fnId = uuidv4();

        this.objectTable[objectId].associations[fnId] = fn;

        return fnId;
    }

    private toDelegatePullPropertyFunction(proxy: ISender, objectId: string, properyName: string): () => any {
        return () => {
            const resultInfo: IVariableInfo = proxy.sendSync(EventNames.pullProperty, <IPropertyRequest>{
                objectId: objectId,
                propertyName: properyName
            });

            return this.toArg(proxy, objectId, resultInfo);
        };
    }

    private toDelegatePushPropertyFunction(proxy: ISender, objectId: string, propertyName: string): (value: any) => void {
        return this.toDelegateCallPropertyFunction(proxy, objectId, propertyName);
    }

    private toDelegateCallPropertyFunction(proxy: ISender, objectId: string, properyName: string): (...args: Array<any>) => any {
        return (...args: Array<any>): any => {
            const resultInfo: IVariableInfo = proxy.sendSync(EventNames.callProperty, <IPropertyRequest>{
                objectId: objectId,
                propertyName: properyName,
                argInfos: this.toArgInfos(proxy, objectId, args)
            });

            return this.toArg(proxy, objectId, resultInfo);
        };
    }

    private toDelegateFunction(proxy: ISender, objectId: string, functionId: string): Function {
        return (...args: Array<any>): any => {
            const resultInfo: IVariableInfo = proxy.sendSync(EventNames.callFunction, <IFunctionRequest>{
                objectId: objectId,
                functionId: functionId,
                argInfos: this.toArgInfos(proxy, objectId, args)
            });

            return this.toArg(proxy, objectId, resultInfo);
        };
    }
}
