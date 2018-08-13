//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export enum DataType {
    Undefined = "undefined",
    Null = "null",
    Object = "object",
    Boolean = "boolean",
    Number = "number",
    String = "string",
    Symbol = "symbol",
    Function = "function",
    Buffer = "node-buffer"
}

const DataTypeValues: Array<string> = Object.values(DataType);

export interface IDataInfo {
    type: DataType;
    id?: string;
    value?: any;
}

export const True: IDataInfo = {
    type: DataType.Boolean,
    value: true
};

export const False: IDataInfo = {
    type: DataType.Boolean,
    value: false
};

export const Null: IDataInfo = {
    type: DataType.Null,
    value: null
};

export const Undefined: IDataInfo = {
    type: DataType.Undefined,
    value: undefined
};

export function dataTypeOf(data: any): DataType {
    const sysType = typeof data;

    switch (sysType) {
        case DataType.Object:
            if (data === null) {
                return DataType.Null;
            } else if (data instanceof Buffer) {
                return DataType.Buffer;
            }

            return DataType.Object;

        default:
            return <DataType>sysType;
    }
}

export function isDataInfo(dataInfo: IDataInfo): dataInfo is IDataInfo {
    return !String.isEmptyOrWhitespace(dataInfo.type)
        && DataTypeValues.includes(dataInfo.type);
}
