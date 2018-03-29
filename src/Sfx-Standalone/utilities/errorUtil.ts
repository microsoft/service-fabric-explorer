//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import "./utils";

export interface ISerializedError {
    message: string;
    stack: string;
}

export class SerializableError extends Error {
    public toJSON(): ISerializedError {
        return {
            message: this.message,
            stack: this.stack
        };
    }

    public static from(serializedError: ISerializedError): Error {
         const error = new SerializableError(serializedError.message);

         error.stack = serializedError.stack;
         return error;
    }
}

export default function error(messageOrFormat: string, ...params: Array<any>): Error {
    if (!Array.isArray(params)) {
        return new SerializableError(messageOrFormat);
    }

    return new SerializableError(String.format(messageOrFormat, ...params));
}
