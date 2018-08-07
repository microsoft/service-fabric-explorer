//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import {
    ILog,
    ILogger,
    ILoggingSettings,
    Severity
} from "sfx.logging";

import { IConsoleLoggerSettings } from "./loggers/console";

import * as utils from "../../utilities/utils";

export enum Severities {
    Event = "event",
    Verbose = "verbose",
    Information = "info",
    Warning = "warning",
    Error = "error",
    Critical = "critical"
}

const defaultLoggingSettings: ILoggingSettings = {
    logCallerInfo: true,
    loggers: [
        <IConsoleLoggerSettings>{
            name: "console",
            component: "logging.logger.console",
            logAllProperties: false,
            logCallerInfo: true
        }
    ]
};

export async function createAsync(loggingSettings?: ILoggingSettings): Promise<ILog> {
    if (!utils.isNullOrUndefined(loggingSettings)
        && !Object.isObject(loggingSettings)) {
        throw new Error("loggingSettings must be an Object implementing ILoggingSettings.");
    }

    loggingSettings = loggingSettings || defaultLoggingSettings;
    const log = new Log(loggingSettings.logCallerInfo, loggingSettings.properties);

    if (!loggingSettings.loggers) {
        return log;
    }

    if (!Object.isObject(loggingSettings.loggers)) {
        throw new Error("loggingSettings.loggers must be an object implementing IDicionary<ILoggerSettings>.");
    }

    for (const loggerSettings of loggingSettings.loggers) {
        let logger: ILogger;

        if (sfxModuleManager !== undefined) {
            logger = await sfxModuleManager.getComponentAsync<ILogger>(
                loggerSettings.component,
                loggerSettings);
        } else {
            const loggerModule = require("./loggers/" + loggerSettings.component.substr(loggerSettings.component.lastIndexOf(".") + 1));

            if (loggerModule.default !== undefined) {
                logger = new loggerModule.default(loggerSettings);
            } else {
                logger = new (loggerModule[loggerSettings.component])(loggerSettings);
            }
        }

        if (!logger) {
            throw new Error(`failed to load logger, ${loggerSettings.component}, named '${loggerSettings.name}'.`);
        }

        await log.addLoggerAsync(logger);
    }

    return log;
}

class Log implements ILog {
    private loggers: Array<ILogger>;

    private defaultProperties: IDictionary<any>;

    private readonly logCallerInfo: boolean;

    private static stringifier(obj: any): string {
        if (obj instanceof Error) {
            obj = obj.toJSON();
        }

        return utils.defaultStringifier(obj);
    }

    public get disposed(): boolean {
        return this.loggers === undefined;
    }

    constructor(includeCallerInfo?: boolean, defaultProperties?: IDictionary<any>) {
        if (!utils.isNullOrUndefined(defaultProperties)
            && !Object.isObject(defaultProperties)) {
            throw new Error("defaultProperties must be an object.");
        }

        this.loggers = [];
        this.defaultProperties = defaultProperties;
        this.logCallerInfo = includeCallerInfo === true;
    }

    public async writeMoreAsync(properties: IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): Promise<void> {
        this.validateDisposal();

        if (!String.isString(messageOrFormat)) {
            return;
        }

        if (Array.isArray(params) && params.length > 0) {
            messageOrFormat = utils.formatEx(Log.stringifier, messageOrFormat, ...params);
        }

        properties = this.generateProperties(properties);

        await Promise.all(this.loggers.map((logger) => logger.writeAsync(properties, severity, messageOrFormat)));
    }

    public writeAsync(severity: Severity, messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeMoreAsync(null, severity, messageOrFormat, ...params);
    }

    public writeInfoAsync(messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeAsync(Severities.Information, messageOrFormat, ...params);
    }

    public writeVerboseAsync(messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeAsync(Severities.Verbose, messageOrFormat, ...params);
    }

    public writeWarningAsync(messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeAsync(Severities.Warning, messageOrFormat, ...params);
    }

    public writeErrorAsync(messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeAsync(Severities.Error, messageOrFormat, ...params);
    }

    public writeCriticalAsync(messageOrFormat: string, ...params: Array<any>): Promise<void> {
        return this.writeAsync(Severities.Critical, messageOrFormat, ...params);
    }

    public async writeExceptionAsync(exception: Error, properties?: IDictionary<string>): Promise<void> {
        this.validateDisposal();

        properties = this.generateProperties(properties);

        await Promise.all(this.loggers.map((logger) => logger.writeExceptionAsync(properties, exception)));
    }

    public async writeEventAsync(name: string, properties?: IDictionary<string>): Promise<void> {
        this.validateDisposal();

        if (!String.isString(name)) {
            return;
        }

        properties = this.generateProperties(properties);

        await Promise.all(this.loggers.map((logger) => logger.writeAsync(properties, Severities.Event, name)));
    }

    public async writeMetricAsync(name: string, value?: number, properties?: IDictionary<string>): Promise<void> {
        this.validateDisposal();

        if (!String.isString(name)) {
            return;
        }

        if (!Number.isNumber(value)) {
            value = 1;
        }

        properties = this.generateProperties(properties);

        await Promise.all(this.loggers.map((logger) => logger.writeMetricAsync(properties, name, value)));
    }

    public async removeLoggerAsync(name: string): Promise<ILogger> {
        this.validateDisposal();

        if (!String.isString(name)) {
            throw new Error("name must be supplied.");
        }

        for (let loggerIndex = 0; loggerIndex < this.loggers.length; loggerIndex++) {
            const logger = this.loggers[loggerIndex];

            if (name === await logger.name) {
                return this.loggers.splice(loggerIndex, 1)[0];
            }
        }

        return undefined;
    }

    public async addLoggerAsync(logger: ILogger): Promise<void> {
        this.validateDisposal();

        if (!logger) {
            throw new Error("logger must be provided.");
        }

        if (!Object.isObject(logger)) {
            throw new Error("logger must be an object implementing ILogger.");
        }

        this.loggers.push(logger);
    }

    public async disposeAsync(): Promise<void> {
        this.defaultProperties = undefined;
        this.loggers = undefined;
    }

    private validateDisposal() {
        if (this.disposed) {
            throw new Error("Already disposed.");
        }
    }

    private generateProperties(properties: IDictionary<string>): IDictionary<string> {
        let finalProperties: IDictionary<string> = null;

        if (this.defaultProperties) {
            finalProperties = Object.create(this.defaultProperties);
        }

        if (Object.isObject(properties)) {
            finalProperties = finalProperties || Object.create(null);
            finalProperties = Object.assign(finalProperties, properties);
        }

        if (this.logCallerInfo) {
            const callerInfo = utils.getCallerInfo();
            const typeName = callerInfo.typeName || "";
            let functionName = callerInfo.functionName;

            if (!functionName) {
                functionName = `<Anonymous>@{${callerInfo.lineNumber},${callerInfo.columnNumber}}`;
            }

            finalProperties = finalProperties || Object.create(null);
            finalProperties["Caller.FileName"] = callerInfo.fileName;

            if (!String.isEmptyOrWhitespace(typeName)) {
                finalProperties["Caller.Name"] = `${typeName}.`;
            } else {
                finalProperties["Caller.Name"] = "";
            }

            finalProperties["Caller.Name"] += `${functionName}()`;
        }

        return finalProperties;
    }
}
