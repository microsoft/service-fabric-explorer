//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as util from "util";

import { Severity, ILoggerSettings, ILogger } from "../log";

function formatProperties(properties: IDictionary<string>): string {
    let consoleMsg: string = "";

    if (!util.isNullOrUndefined(properties)) {
        for (let propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
                consoleMsg += util.format("<%s:%s>", propertyName, properties[propertyName]);
            }
        }
    }

    return consoleMsg;
}

function formatConsoleMsg(properties: IDictionary<string>, message: string): string {
    let consoleMsg: string = "[" + new Date().toLocaleTimeString() + "] ";

    consoleMsg += formatProperties(properties);
    consoleMsg += " ";
    consoleMsg += message;

    return consoleMsg;
}

class ConsoleLogger implements ILogger {
    private console: Console;

    constructor(targetConsole?: Console) {
        if (util.isNullOrUndefined(targetConsole)) {
            this.console = console;
        } else {
            this.console = targetConsole;
        }
    }

    public log(properties: IDictionary<string>, severity: Severity, message: string): void {
        let consoleMsg: string = formatConsoleMsg(properties, message);

        switch (severity) {
            case Severity.Critical:
                this.console.error(consoleMsg);
                this.console.trace();
                break;

            case Severity.Error:
                this.console.error(consoleMsg);
                break;

            case Severity.Warning:
                this.console.warn(consoleMsg);
                break;

            case Severity.Event:
            case Severity.Information:
                this.console.info(consoleMsg);
                break;

            case Severity.Verbose:
            default:
                this.console.debug(consoleMsg);
                break;
        }
    }

    public logException(properties: IDictionary<string>, error: Error): void {
        let exceptionMsg: string = "";

        exceptionMsg += error.name + ": " + error.message;
        exceptionMsg += "\r\n";
        exceptionMsg += error.stack;

        this.console.exception(formatConsoleMsg(properties, exceptionMsg));
    }

    public logMetric(properties: IDictionary<string>, name: string, value: number): void {
        this.console.info(formatConsoleMsg(properties, name + ": " + value.toString()));
    }
}

export function create(loggerSettings: ILoggerSettings): ILogger {
    return new ConsoleLogger();
}
