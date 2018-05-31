//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDataInfo } from "./data-info";

export enum DelegationType {
    GetProperty = "Get",
    SetProperty = "Set",
    Apply = "Apply",
    Dispose = "Dispose"
}

export interface IDelegation {
    getProperty(refId: string, property: string | number): IDataInfo | Promise<IDataInfo>;
    setProperty(refId: string, property: string | number, valueDataInfo: IDataInfo): IDataInfo | Promise<IDataInfo>;
    apply(refId: string, thisArgDataInfo: IDataInfo, argsDataInfos: Array<IDataInfo>): IDataInfo | Promise<IDataInfo>;
    dispose(refId: string, parentId?: string): IDataInfo | Promise<IDataInfo>;
}

export interface IDelegateMessage {
    refId: string;
}

export interface IDisposeDelegateMessage
    extends IDelegateMessage {
    parentId: string;
}

export interface IPropertyDelegationMessage
    extends IDelegateMessage {
    property: string | number;
}

export interface ISetPropertyDelegationMessage
    extends IPropertyDelegationMessage {
    value: IDataInfo;
}

export interface IApplyDelegationMessage
    extends IDelegateMessage {
    thisArg: IDataInfo;
    args: Array<IDataInfo>;
}

export interface IDelegator {
    delegate(type: DelegationType, msg: IDelegateMessage): IDataInfo | Promise<IDataInfo>;
}

export class Delegation {
    private delegator: IDelegator;

    constructor(delegator: IDelegator) {
        this.delegator = delegator;
    }

    public getProperty(refId: string, property: string | number): IDataInfo | Promise<IDataInfo> {
        const msg: IPropertyDelegationMessage = {
            refId: refId,
            property: property
        };

        return this.delegator.delegate(DelegationType.GetProperty, msg);
    }

    public setProperty(refId: string, property: string | number, valueDataInfo: IDataInfo): IDataInfo | Promise<IDataInfo> {
        const msg: ISetPropertyDelegationMessage = {
            refId: refId,
            property: property,
            value: valueDataInfo
        };

        return this.delegator.delegate(DelegationType.SetProperty, msg);
    }

    public apply(refId: string, thisArgDataInfo: IDataInfo, argsDataInfos: Array<IDataInfo>): IDataInfo | Promise<IDataInfo> {
        const msg: IApplyDelegationMessage = {
            refId: refId,
            thisArg: thisArgDataInfo,
            args: argsDataInfos
        };

        return this.delegator.delegate(DelegationType.Apply, msg);
    }

    public dispose(refId: string, parentId?: string): IDataInfo | Promise<IDataInfo> {
        const msg: IDisposeDelegateMessage = {
            refId: refId,
            parentId: parentId
        };

        return this.delegator.delegate(DelegationType.Dispose, msg);
    }
}
