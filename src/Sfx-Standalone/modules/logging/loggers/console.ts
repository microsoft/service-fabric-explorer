//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
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

    private console: Console;

    public get name(): string {
        return this.settings.name;
    }

    public get disposed(): boolean {
        return this.console === undefined;
    }

    constructor(settings: IConsoleLoggerSettings, targetConsole?: Console) {
        if (!Object.isObject(settings)) {
            settings = {
                name: "console",
                component: "logging.logger.console"
            };
        }

        this.settings = settings;
        this.settings.logAllProperties = settings.logAllProperties === true;
        this.settings.logCallerInfo = utils.getValue(settings.logCallerInfo, true);

        if (utils.isNullOrUndefined(targetConsole)) {
            this.console = console;
        } else {
            this.console = targetConsole;
        }
    }

    public writeAsync(properties: IDictionary<string>, severity: Severity, message: string): Promise<void> {
        this.validateDisposal();
        const consoleMsg: string = this.formatConsoleMsg(properties, message);

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

        return Promise.resolve();
    }

    public writeExceptionAsync(properties: IDictionary<string>, error: Error): Promise<void> {
        this.validateDisposal();
        let exceptionMsg: string = "";

        exceptionMsg += error.name + ": " + error.message;
        exceptionMsg += "\r\n";
        exceptionMsg += error.stack;

        this.console.error(this.formatConsoleMsg(properties, exceptionMsg));

        return Promise.resolve();
    }

    public writeMetricAsync(properties: IDictionary<string>, name: string, value: number): Promise<void> {
        this.validateDisposal();
        this.console.info(this.formatConsoleMsg(properties, name + ": " + value.toString()));

        return Promise.resolve();
    }

    public disposeAsync(): Promise<void> {
        this.console = undefined;

        return Promise.resolve();
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Logger, "${this.name}", already disposed.`);
        }
    }

    private formatProperties(properties: IDictionary<string>): string {
        let consoleMsg: string = "";

        if (!utils.isNullOrUndefined(properties)) {

            if (this.settings.logAllProperties) {
                for (const propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName) && !propertyName.startsWith("Caller.")) {
                        consoleMsg += `<${propertyName}:${properties[propertyName]}>`;
                    }
                }
            }

            if (this.settings.logCallerInfo
                && (!String.isEmptyOrWhitespace(properties["Caller.FileName"])
                    || !String.isEmptyOrWhitespace(properties["Caller.Name"]))) {
                consoleMsg += `[${path.basename(properties["Caller.FileName"])}:${properties["Caller.Name"]}]`;
            }
        }

        return consoleMsg;
    }

    private formatConsoleMsg(properties: IDictionary<string>, message: string): string {
        let consoleMsg: string = "[" + new Date().toLocaleTimeString() + "]";

        const formatedProperties = this.formatProperties(properties);

        if (!String.isEmptyOrWhitespace(formatedProperties)) {
            consoleMsg += " ";
            consoleMsg += formatedProperties;
        }

        consoleMsg += " ";
        consoleMsg += message;

        return consoleMsg;
    }
}
