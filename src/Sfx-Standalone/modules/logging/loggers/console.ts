//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx";
import { ILogger, ILoggerSettings, Severity } from "sfx.logging";

import * as path from "path";

import * as utils from "../../../utilities/utils";
import { Severities } from "../log";

export interface IConsoleLoggerSettings extends ILoggerSettings {
    logAllProperties?: boolean;
    logCallerInfo?: boolean;
}

export default class ConsoleLogger implements ILogger {
    private readonly settings: IConsoleLoggerSettings;

    private readonly console: Console;

    constructor(settings: IConsoleLoggerSettings, targetConsole?: Console) {
        if (!Object.isObject(settings)) {
            settings = {
                type: "console"
            };
        }

        this.settings = settings;
        this.settings.logAllProperties = utils.getEither(settings.logAllProperties, false);
        this.settings.logCallerInfo = utils.getEither(settings.logCallerInfo, true);

        if (utils.isNullOrUndefined(targetConsole)) {
            this.console = console;
        } else {
            this.console = targetConsole;
        }
    }

    public write(properties: IDictionary<string>, severity: Severity, message: string): void {
        let consoleMsg: string = this.formatConsoleMsg(properties, message);

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
                this.console.log(consoleMsg);
                break;
        }
    }

    public writeException(properties: IDictionary<string>, error: Error): void {
        let exceptionMsg: string = "";

        exceptionMsg += error.name + ": " + error.message;
        exceptionMsg += "\r\n";
        exceptionMsg += error.stack;

        this.console.error(this.formatConsoleMsg(properties, exceptionMsg));
    }

    public writeMetric(properties: IDictionary<string>, name: string, value: number): void {
        this.console.info(this.formatConsoleMsg(properties, name + ": " + value.toString()));
    }

    private formatProperties(properties: IDictionary<string>): string {
        let consoleMsg: string = "";

        if (!utils.isNullOrUndefined(properties)) {

            if (this.settings.logAllProperties) {
                for (let propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName) && !propertyName.startsWith("Caller.")) {
                        consoleMsg += String.format("<{}:{}>", propertyName, properties[propertyName]);
                    }
                }
            }

            if (this.settings.logCallerInfo
                && (!String.isNullUndefinedOrWhitespace(properties["Caller.FileName"])
                    || !String.isNullUndefinedOrWhitespace(properties["Caller.Name"]))) {
                consoleMsg +=
                    String.format("[{}:{}]",
                        path.basename(properties["Caller.FileName"]),
                        properties["Caller.Name"]);
            }
        }

        return consoleMsg;
    }

    private formatConsoleMsg(properties: IDictionary<string>, message: string): string {
        let consoleMsg: string = "[" + new Date().toLocaleTimeString() + "]";

        const formatedProperties = this.formatProperties(properties);

        if (!String.isNullUndefinedOrWhitespace(formatedProperties)) {
            consoleMsg += " ";
            consoleMsg += formatedProperties;
        }

        consoleMsg += " ";
        consoleMsg += message;

        return consoleMsg;
    }
}
