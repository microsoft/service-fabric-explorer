//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export function isNullOrUndefined(value: any): value is undefined | null {
    return value === undefined || value === null;
}

export function getEither<T>(arg: T, defaultValue: T): T {
    return (arg === undefined || arg === null) ? defaultValue : arg;
}

declare global {
    interface StringConstructor {
        isString(value: any): value is string | String;
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
    }

    interface NumberConstructor {
        isNumber(value: any): value is number | Number;
    }
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

Array.isNullUndefinedOrEmpty = (value: any): boolean => {
    return value === undefined || value === null || (Array.isArray(value) && value.length <= 0);
};

String.isString = (value: any): value is string | String => {
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
