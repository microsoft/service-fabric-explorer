//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";
import { HandlerChainBuilder } from "../../utilities/handlerChainBuilder";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
export enum DataType {
    Undefined = "undefined",
    Object = "object",
    Boolean = "boolean",
    Number = "number",
    String = "string",
    Symbol = "symbol",
    Function = "function"
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
    propertyName?: string;
    data?: TData;
}

export interface IGetActionInfo extends IActionInfo<undefined> {
}

export interface ISetActionInfo extends IActionInfo<any> {
}

export interface IApplyActionInfo extends IActionInfo<Array<IDataInfo>> {
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
        && !String.isNullUndefinedOrWhitespace(dataInfo.type)
        && Object.values(DataType).findIndex((value) => value === dataInfo.type) >= 0
}

export function isActionInfo(actionInfo: any): actionInfo is IActionInfo<any> {
    return !utils.isNullOrUndefined(actionInfo)
        && !String.isNullUndefinedOrWhitespace(actionInfo.action)
        && Object.values(ActionType).findIndex((value) => value === actionInfo.action) >= 0
        && !String.isNullUndefinedOrWhitespace(actionInfo.id);
}

export function toDataInfo(data: any): IDataInfo {
    return {
        type: <DataType>(typeof data),
        data: data
    };
}
