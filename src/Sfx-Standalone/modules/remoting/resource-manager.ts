//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import error from "../../utilities/errorUtil";
import * as utils from "../../utilities/utils";

import { ReferenceNode } from "./reference-node";

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

export interface IResourceInfo {
    id?: string;
    type: DataType;
    value?: any;
}

namespace ResourceInfos {
    export const True: IResourceInfo = {
        type: DataType.Boolean,
        value: true
    };

    export const False: IResourceInfo = {
        type: DataType.Boolean,
        value: false
    };

    export const Null: IResourceInfo = {
        type: DataType.Null,
        value: null
    };

    export const Undefined: IResourceInfo = {
        type: DataType.Undefined,
        value: undefined
    };
}

function dataTypeOf(data: any): DataType {
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

export class ResourceManager {
    private refRoot: ReferenceNode;

    constructor() {
        this.refRoot = ReferenceNode.createRoot();
    }

    public register(target: any): IResourceInfo {
        
    }

    public unregister(resourceId: string): void {

    }
}