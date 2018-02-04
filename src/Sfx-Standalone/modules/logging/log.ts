//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ILog, ILogger, ILoggingSettings, ILoggerSettings, Severity } from "../../@types/log";
import * as utils from "../../utilities/utils";
import error from "../../utilities/errorUtil";

export enum Severities {
    Event = "event",
    Verbose = "verbose",
    Information = "info",
    Warning = "warning",
    Error = "error",
    Critical = "critical"
}

export class Log implements ILog {
    private readonly moduleManager: IModuleManager;

    private readonly loggers: IDictionary<ILogger>;

    private readonly defaultPropertiesInJson: string;

    constructor(moduleManager: IModuleManager, loggingSettings?: ILoggingSettings) {
        if (utils.isNullOrUndefined(moduleManager)
            || !Object.isObject(moduleManager)) {
            throw error("Valid moduleManager must be supplied.");
        }

        if (utils.isNullOrUndefined(loggingSettings)) {
            loggingSettings = {
                loggers: {
                    console: {
                        type: "loggers.console"
                    }
                }
            };
        } else if (!Object.isObject(loggingSettings)) {
            throw error("valid loggingSetting must be supplied.");
        }

        this.loggers = {};
        this.defaultPropertiesInJson = undefined;
        this.moduleManager = moduleManager;

        if (Object.isObject(loggingSettings.properties)) {
            this.defaultPropertiesInJson = JSON.stringify(loggingSettings.properties);
        }

        if (!utils.isNullOrUndefined(loggingSettings.loggers)) {
            for (const loggerName in loggingSettings.loggers) {
                if (loggingSettings.loggers.hasOwnProperty(loggerName)) {
                    const loggerSettings: ILoggerSettings = loggingSettings.loggers[loggerName];
                    const logger: ILogger = this.moduleManager.getComponent(
                        String.format("loggers.{}", loggerSettings.type),
                        loggerSettings);

                    if (logger === undefined) {
                        throw error(
                            "failed to load logger, {}, named '{}', with component identity: {}.", 
                            loggerSettings.type, 
                            loggerName, 
                            String.format("loggers.{}", loggerSettings.type));
                    }

                    this.loggers[loggerName] = logger;
                }
            }
        }
    }

    public writeMore(properties: IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): void {
        if (!String.isString(messageOrFormat)) {
            return;
        }

        if (Array.isArray(params) && params.length > 0) {
            messageOrFormat = String.format(messageOrFormat, ...params);
        }

        properties = this.generateProperties(properties);
        this.foreachLogger((logger) => logger.write(properties, severity, messageOrFormat));
    }

    public write(severity: Severity, messageOrFormat: string, ...params: Array<any>): void {
        this.writeMore(null, severity, messageOrFormat, ...params);
    }

    public writeInfo(messageOrFormat: string, ...params: Array<any>) {
        this.write(Severities.Information, messageOrFormat, ...params);
    }

    public writeVerbose(messageOrFormat: string, ...params: Array<any>) {
        this.write(Severities.Verbose, messageOrFormat, ...params);
    }

    public writeWarning(messageOrFormat: string, ...params: Array<any>) {
        this.write(Severities.Warning, messageOrFormat, ...params);
    }

    public writeError(messageOrFormat: string, ...params: Array<any>) {
        this.write(Severities.Error, messageOrFormat, ...params);
    }

    public writeCritical(messageOrFormat: string, ...params: Array<any>) {
        this.write(Severities.Critical, messageOrFormat, ...params);
    }

    public writeException(exception: Error, properties?: IDictionary<string>): void {
        properties = this.generateProperties(properties);
        this.foreachLogger((logger) => logger.writeException(properties, exception));
    }

    public writeEvent(name: string, properties?: IDictionary<string>) {
        if (!String.isString(name)) {
            return;
        }

        properties = this.generateProperties(properties);
        this.foreachLogger((logger) => logger.write(properties, Severities.Event, name));
    }

    public writeMetric(name: string, value?: number, properties?: IDictionary<string>): void {
        if (!String.isString(name)) {
            return;
        }

        if (!Number.isNumber(value)) {
            value = 1;
        }

        properties = this.generateProperties(properties);
        this.foreachLogger((logger) => logger.writeMetric(properties, name, value));
    }

    public getLogger(name: string): ILogger {
        if (!String.isString(name)) {
            throw error("name must be supplied.");
        }

        return this.loggers[name];
    }

    public setLogger(name: string, logger: ILogger = undefined): void {
        if (!String.isString(name) || name.trim() === "") {
            throw error("name must be supplied.");
        }

        if (utils.isNullOrUndefined(logger)) {
            delete this.loggers[name];
        } else {
            this.loggers[name] = logger;
        }
    }

    private foreachLogger(callback: (logger: ILogger) => void): void {
        for (const loggerName in this.loggers) {
            if (this.loggers.hasOwnProperty(loggerName)) {
                callback(this.loggers[loggerName]);
            }
        }
    }

    private generateProperties(properties: IDictionary<string>): IDictionary<string> {
        let finalProperties: IDictionary<string> = null;

        if (this.defaultPropertiesInJson !== undefined) {
            finalProperties = JSON.parse(this.defaultPropertiesInJson);
        }

        if (Object.isObject(properties)) {
            finalProperties = finalProperties === null ? properties : Object.assign(finalProperties, properties);
        }

        return finalProperties;
    }
}
