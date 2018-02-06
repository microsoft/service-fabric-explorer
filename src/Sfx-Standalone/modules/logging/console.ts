//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILogger, ILoggerSettings, Severity } from "../../@types/log";
import * as utils from "../../utilities/utils";
import { Severities } from "./log";

function formatProperties(properties: IDictionary<string>): string {
    let consoleMsg: string = "";

    if (!utils.isNullOrUndefined(properties)) {
        for (let propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
                consoleMsg += String.format("<{}:{}>", propertyName, properties[propertyName]);
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

export class ConsoleLogger implements ILogger {
    private console: Console;

    constructor(settings: ILoggerSettings, targetConsole?: Console) {
        if (utils.isNullOrUndefined(targetConsole)) {
            this.console = console;
        } else {
            this.console = targetConsole;
        }
    }

    public write(properties: IDictionary<string>, severity: Severity, message: string): void {
        let consoleMsg: string = formatConsoleMsg(properties, message);

        switch (severity) {
            case Severities.Critical:
                this.console.error(consoleMsg);
                this.console.trace();
                break;

            case Severities.Error:
                this.console.error(consoleMsg);
                break;

            case Severities.Warning:
                this.console.warn(consoleMsg);
                break;

            case Severities.Event:
            case Severities.Information:
                this.console.info(consoleMsg);
                break;

            case Severities.Verbose:
            default:
                this.console.debug(consoleMsg);
                break;
        }
    }

    public writeException(properties: IDictionary<string>, error: Error): void {
        let exceptionMsg: string = "";

        exceptionMsg += error.name + ": " + error.message;
        exceptionMsg += "\r\n";
        exceptionMsg += error.stack;

        this.console.exception(formatConsoleMsg(properties, exceptionMsg));
    }

    public writeMetric(properties: IDictionary<string>, name: string, value: number): void {
        this.console.info(formatConsoleMsg(properties, name + ": " + value.toString()));
    }
}
