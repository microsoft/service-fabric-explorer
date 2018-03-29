//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as uuidv4 from "uuid/v4";

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";
import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";

export enum DataType {
    Undefined = "undefined",
    Null = "null",
    Object = "object",
    Boolean = "boolean",
    Number = "number",
    String = "string",
    Symbol = "symbol",
    Function = "function",
    Array = "array"
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
export enum ActionType {
    Get = "Get",
    Set = "Set",
    Apply = "Apply",
    Has = "Has",
    DeleteProperty = "DeleteProperty",
    OwnKeys = "OwnKeys",
    GetPrototypeOf = "GetPrototypeOf",
    SetPrototypeOf = "SetPrototypeOf",
    IsExtensible = "IsExtensible",
    PreventExtensions = "PreventExtensions",
    GetOwnPropertyDescriptor = "GetOwnPropertyDescriptor",
    DefineProperty = "DefineProperty"
}

export interface IDataInfo {
    type: DataType;
    data: any;
}

export interface IActionInfo<TData> {
    action: ActionType;
    id: string;
    propertyName?: string | number;
    data?: TData;
}

export interface IGetActionInfo extends IActionInfo<undefined> {
}

export interface ISetActionInfo extends IActionInfo<IDataInfo> {
}

export interface IFunctionData {
    thisArg: IDataInfo;
    args: Array<IDataInfo>;
}

export interface IApplyActionInfo extends IActionInfo<IFunctionData> {
}

export function isCommunicator(communicator: any): communicator is ICommunicator {
    return !utils.isNullOrUndefined(communicator)
        && String.isString(communicator.id)
        && Function.isFunction(communicator.map)
        && Function.isFunction(communicator.unmap)
        && Function.isFunction(communicator.sendAsync);
}

export function isDataInfo(dataInfo: any): dataInfo is IActionInfo<any> {
    return !utils.isNullOrUndefined(dataInfo)
        && !String.isNullUndefinedOrEmpty(dataInfo.type)
        && Object.values(DataType).findIndex((value) => value === dataInfo.type) >= 0;
}

export function isActionInfo(actionInfo: any): actionInfo is IActionInfo<any> {
    return !utils.isNullOrUndefined(actionInfo)
        && !String.isNullUndefinedOrWhitespace(actionInfo.action)
        && Object.values(ActionType).findIndex((value) => value === actionInfo.action) >= 0
        && !String.isNullUndefinedOrWhitespace(actionInfo.id);
}

export function dataType(data: any): DataType {
    const sysType = typeof data;

    switch (sysType) {
        case DataType.Object:
            if (data === null) {
                return DataType.Null;
            } else if (Array.isArray(data)) {
                return DataType.Array;
            } else {
                return DataType.Object;
            }

        default:
            return <DataType>sysType;
    }
}

export function toDataInfo(data: any): IDataInfo {
    const dataInfo: IDataInfo = {
        type: dataType(data),
        data: data
    };

    if (dataInfo.type === DataType.Object || dataInfo.type === DataType.Function) {
        dataInfo.data = uuidv4();
    }

    return dataInfo;
}
