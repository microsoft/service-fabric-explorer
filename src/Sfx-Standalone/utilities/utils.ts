//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

namespace Symbols {
    export const Serializable = Symbol("serializable");
}

Symbol.isSymbol = (value: any): value is symbol => {
    return typeof value === "symbol";
};

Number.isNumber = (value: any): value is number | Number => {
    return typeof value === "number" || value instanceof Number;
};

Function.isFunction = (value: any): value is Function => {
    return typeof value === "function";
};

Object.isObject = (value: any): value is object | Object => {
    return value !== null && typeof value === "object";
};

Object.isEmpty = (value: Object | object) => {
    if (isNullOrUndefined(value)) {
        throw new Error("value cannot be null/undefined.");
    }

    for (const key in value) {
        if (key) {
            return false;
        }

        return false;
    }

    return true;
};

Object.markSerializable = (value: any, serializable: boolean = true) => {
    if (!isNullOrUndefined(value)) {
        if (Function.isFunction(value)) {
            throw new Error("Cannot mark function objects as serializable.");
        }

        if (Symbol.isSymbol(value)) {
            throw new Error("Cannot mark symbol objects as serializable.");
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

            if (Object.prototype.hasOwnProperty.call(value, Symbols.Serializable)) {
                return value[Symbols.Serializable] === true;
            }

            if (Function.isFunction(value["toJSON"])) {
                return true;
            }

            if (Array.isArray(value)) {
                return value.every((itemValue) => Object.isSerializable(itemValue));
            }

            return Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every((propertyValue) => Object.isSerializable(propertyValue));

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

String.possibleString = (value: any): value is string => {
    return isNullOrUndefined(value) || String.isString(value);
};

String.isString = (value: any): value is string => {
    return typeof value === "string" || value instanceof String;
};

String.isEmpty = (value: string): boolean => {
    return value === "";
};

String.isEmptyOrWhitespace = (value: string): boolean => {
    return value.trim() === "";
};

Error.prototype.toJSON = function (): any {
    const error = Object.create(null);

    error.message = `Error: ${this.message}`;
    error.stack = this.stack;

    return error;
};

export function defaultStringifier(obj: any, padding?: number): string {
    padding = getValue(padding, 0);

    if (obj === null) {
        return "null";
    } else if (obj === undefined) {
        return "undefined";
    } else {
        const objType = typeof obj;

        if ((objType !== "object")
            || (objType === "object"
                && Function.isFunction(obj.toString)
                && obj.toString !== Object.prototype.toString)) {
            return obj.toString();
        } else {
            let str: string = `\n${"".padStart(padding)}{\n`;

            for (const propertyName of Object.getOwnPropertyNames(obj)) {
                str += `${"".padStart(padding + 4)}${propertyName}: ${defaultStringifier(obj[propertyName], padding + 4)}\n`;
            }

            str += `${"".padStart(padding)}}`;

            return str;
        }
    }
}

export function formatEx(stringifier: (obj: any) => string, format: string, ...args: Array<any>): string {
    if (!Function.isFunction(stringifier)) {
        throw new Error("stringifier must be a function.");
    }

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

        const argIndex = argIndexStr.length === 0 ? matchIndex : parseInt(argIndexStr, 10);

        if (isNaN(argIndex) || argIndex < 0 || argIndex >= args.length) {
            throw new Error(`Referenced arg index, '${argIndexStr}',is out of range of the args.`);
        }

        return stringifier(args[argIndex]);
    });
}

export const format: (format: string, ...args: Array<any>) => string = formatEx.bind(null, defaultStringifier);

export function isNullOrUndefined(value: any): value is undefined | null {
    return value === undefined || value === null;
}

export function getValue<T>(arg: T, defaultValue: T): T {
    return (arg === undefined || arg === null) ? defaultValue : arg;
}

export interface ICallerInfo {
    fileName: string;
    functionName: string;
    typeName: string;
    lineNumber: number;
    columnNumber: number;
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
                        typeName: stack.getTypeName(),
                        lineNumber: stack.getLineNumber(),
                        columnNumber: stack.getColumnNumber()
                    };
                }
            } else if (stackFileName !== directCallerInfo.fileName) {
                return {
                    fileName: stackFileName,
                    functionName: stack.getFunctionName(),
                    typeName: stack.getTypeName(),
                    lineNumber: stack.getLineNumber(),
                    columnNumber: stack.getColumnNumber()
                };
            }
        }

        return directCallerInfo;
    } finally {
        Error.prepareStackTrace = previousPrepareStackTraceFn;
    }
}
