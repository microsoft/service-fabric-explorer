//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import error from "./errorUtil";

declare global {
    interface StringConstructor {
        isString(value: any): value is string;
        format(format: string, ...args: Array<any>): string;
        isNullUndefinedOrEmpty(value: any): boolean;
        isNullUndefinedOrWhitespace(value: any): boolean;
    }

    interface ArrayConstructor {
        isNullUndefinedOrEmpty(value: any): boolean;
    }

    interface FunctionConstructor {
        isFunction(value: any): value is Function;
    }

    interface Function {
        isObject(value: any): value is object | Object;
        /**
         * Check if the value is serializable. 
         * @param {any} value The value to be checked.
         * @param {boolean} [checkDeep=false] Check recursively.
         * @return {boolean} True if the value is serializable for sure. Otherwise, false, 
         * which indicates the value cannot be serialized or cannot be determined whether it can be serialized or not.
         */
        isSerializable(value: any): boolean;
        markSerializable(value: any, serializable?: boolean): any;
    }

    interface NumberConstructor {
        isNumber(value: any): value is number | Number;
    }

    interface SymbolConstructor {
        isSymbol(value: any): value is symbol;
    }
}

namespace Symbols {
    export const Serializable = Symbol("serializable");
}

Symbol.isSymbol = (value: any): value is symbol => {
    return typeof value === "symbol";
}

Number.isNumber = (value: any): value is number | Number => {
    return typeof value === "number" || value instanceof Number;
};

Function.isFunction = (value: any): value is Function => {
    return typeof value === "function";
};

Object.isObject = (value: any): value is object | Object => {
    return value !== null && typeof value === "object";
};

Object.markSerializable = (value: any, serializable: boolean = true) => {
    if (!isNullOrUndefined(value)) {
        if (Function.isFunction(value)) {
            throw error("Cannot mark function objects as serializable.");
        }

        if (Symbol.isSymbol(value)) {
            throw error("Cannot mark symbol objects as serializable.");
        }

        serializable = serializable === true;

        value[Symbols.Serializable] = serializable;
    }

    return value;
};

Object.isSerializable = (value: any) => {
    const valueType = typeof value;

    switch (valueType) {
        case "object":
            if (value === null) {
                return true;
            }

            if (Object.prototype.hasOwnProperty.call(value, Symbols.Serializable)){
                return value[Symbols.Serializable] === true;
            }

            return Function.isFunction(value["toJSON"])
                || (Object.getPrototypeOf(value) === Object.prototype
                    && Object.values(value).every((propertyValue) => Object.isSerializable(propertyValue)));

        case "undefined":
        case "number":
        case "boolean":
        case "string":
            return true;

        case "symbol":
        case "function":
        default:
            return false;
    }
};

Array.isNullUndefinedOrEmpty = (value: any): boolean => {
    return value === undefined || value === null || (Array.isArray(value) && value.length <= 0);
};

String.isString = (value: any): value is string => {
    return typeof value === "string" || value instanceof String;
};

String.isNullUndefinedOrEmpty = (value: any): boolean => {
    return value === undefined || value === null || (String.isString(value) && value === "");
};

String.isNullUndefinedOrWhitespace = (value: any): boolean => {
    return value === undefined || value === null || (String.isString(value) && value.trim() === "");
};

String.format = (format, ...args) => {
    if (!String.isString(format)) {
        throw new Error("format must be a string");
    }

    if (!Array.isArray(args)) {
        throw new Error("args must be an array.");
    }

    if (args === null || args === undefined) {
        return format;
    }

    let matchIndex = -1;

    return format.replace(/(\{*)(\{(\d*)\})/gi, (substring, escapeChar: string, argIdentifier: string, argIndexStr: string) => {
        matchIndex++;

        if (escapeChar.length > 0) {
            return argIdentifier;
        }

        let argIndex = argIndexStr.length === 0 ? matchIndex : parseInt(argIndexStr, 10);

        if (isNaN(argIndex) || argIndex < 0 || argIndex >= args.length) {
            throw new Error(String.format("Referenced arg index, '{}',is out of range of the args.", argIndexStr));
        }

        return args[argIndex];
    });
};

export function isNullOrUndefined(value: any): value is undefined | null {
    return value === undefined || value === null;
}

export function getEither<T>(arg: T, defaultValue: T): T {
    return (arg === undefined || arg === null) ? defaultValue : arg;
}

export interface ICallerInfo {
    fileName: string;
    functionName: string;
    typeName: string;
}

function prepareStackTraceOverride(error: Error, structuredStackTrace: Array<NodeJS.CallSite>): any {
    return structuredStackTrace;
}

export function getCallerInfo(): ICallerInfo {
    const previousPrepareStackTraceFn = Error.prepareStackTrace;

    try {
        Error.prepareStackTrace = prepareStackTraceOverride;

        const callStack: Array<NodeJS.CallSite> = <any>(new Error()).stack;
        let directCallerInfo: ICallerInfo = undefined;

        for (let callStackIndex = 0; callStackIndex < callStack.length; callStackIndex++) {
            const stack = callStack[callStackIndex];
            const stackFileName = stack.getFileName();

            if (directCallerInfo === undefined) {
                if (stackFileName !== module.filename) {
                    directCallerInfo = {
                        fileName: stackFileName,
                        functionName: stack.getFunctionName(),
                        typeName: stack.getTypeName()
                    };
                }
            } else if (stackFileName !== directCallerInfo.fileName) {
                return {
                    fileName: stackFileName,
                    functionName: stack.getFunctionName(),
                    typeName: stack.getTypeName()
                };
            }
        }

        return directCallerInfo;
    } finally {
        Error.prepareStackTrace = previousPrepareStackTraceFn;
    }
}

export function dispose(data: any): void {
    if (!isNullOrUndefined(data) && Function.isFunction(data.dispose)) {
        data.dispose();
    }
}

export async function disposeAsync(data: any): Promise<void> {
    if (!isNullOrUndefined(data) && Function.isFunction(data.dispose)) {
        await data.dispose();
    }
}
