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
    getPropertyAsync(refId: string, property: string | number): Promise<IDataInfo>;
    setPropertyAsync(refId: string, property: string | number, valueDataInfo: IDataInfo): Promise<IDataInfo>;
    applyAsync(refId: string, thisArgDataInfo: IDataInfo, argsDataInfos: Array<IDataInfo>): Promise<IDataInfo>;
    disposeAsync(refId: string, parentId?: string): Promise<IDataInfo>;
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
    delegateAsync(type: DelegationType, msg: IDelegateMessage): Promise<IDataInfo>;
}

export class Delegation {
    private delegator: IDelegator;

    constructor(delegator: IDelegator) {
        this.delegator = delegator;
    }

    public getPropertyAsync(refId: string, property: string | number): Promise<IDataInfo> {
        const msg: IPropertyDelegationMessage = {
            refId: refId,
            property: property
        };

        return this.delegator.delegateAsync(DelegationType.GetProperty, msg);
    }

    public setPropertyAsync(refId: string, property: string | number, valueDataInfo: IDataInfo): Promise<IDataInfo> {
        const msg: ISetPropertyDelegationMessage = {
            refId: refId,
            property: property,
            value: valueDataInfo
        };

        return this.delegator.delegateAsync(DelegationType.SetProperty, msg);
    }

    public applyAsync(refId: string, thisArgDataInfo: IDataInfo, argsDataInfos: Array<IDataInfo>): Promise<IDataInfo> {
        const msg: IApplyDelegationMessage = {
            refId: refId,
            thisArg: thisArgDataInfo,
            args: argsDataInfos
        };

        return this.delegator.delegateAsync(DelegationType.Apply, msg);
    }

    public disposeAsync(refId: string, parentId?: string): Promise<IDataInfo> {
        const msg: IDisposeDelegateMessage = {
            refId: refId,
            parentId: parentId
        };

        return this.delegator.delegateAsync(DelegationType.Dispose, msg);
    }
}
