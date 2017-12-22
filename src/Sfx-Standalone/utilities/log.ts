import * as appInsights from "applicationinsights";
import * as util from "util";

import env from "./env";
import settings from "./settings";
import error from "./errorUtil";

export interface ILoggerModule {
    create(settings: ILoggerSettings): ILogger;
}

export interface ILogger {
    log(properties: IDictionary<string>, severity: Severity, message: string): void;
    logException(properties: IDictionary<string>, error: Error): void;
    logMetric(properties: IDictionary<string>, name: string, value: number): void;
}

export interface ILoggerSettings extends IDictionary<any> {
    type: string;
}

export interface ILoggingSettings {
    autoInitialization: boolean;
    loggers: IDictionary<ILoggerSettings>;
}

export enum Severity {
    Event = "event",
    Verbose = "verbose",
    Information = "info",
    Warning = "warning",
    Error = "error",
    Critical = "critical"
}

let loggers: IDictionary<ILogger> = {};

function foreachLogger(callback: (logger: ILogger) => void): void {
    for (const loggerName in loggers) {
        if (loggers.hasOwnProperty(loggerName)) {
            callback(loggers[loggerName]);
        }
    }
}

function generateProperties(properties: IDictionary<string>): IDictionary<string> {
    if (!util.isObject(properties)) {
        properties = {};
    }

    properties["appInstanceId"] = env.appInstanceId;

    return properties;
}

export function initialize(loggingSettings?: ILoggingSettings) {
    if (util.isNullOrUndefined(loggingSettings)) {
        loggingSettings = settings.default.get("logging");
    }

    if (util.isNullOrUndefined(loggingSettings.loggers)) {
        return;
    }

    for (let loggerName in loggingSettings.loggers) {
        if (loggingSettings.loggers.hasOwnProperty(loggerName)) {
            let loggerSettings: ILoggerSettings = loggingSettings.loggers[loggerName];
            let loggerModule: ILoggerModule = require("./loggers/" + loggerSettings.type);
            let logger = loggerModule.create(loggerSettings);

            loggers[loggerName] = logger;
        }
    }
}

export function logMore(properties: IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): void {
    if (!util.isString(messageOrFormat)) {
        return;
    }

    if (util.isArray(params) && params.length > 0) {
        messageOrFormat = util.format(messageOrFormat, ...params);
    }

    properties = generateProperties(properties);
    foreachLogger((logger) => logger.log(properties, severity, messageOrFormat));
}

export function log(severity: Severity, messageOrFormat: string, ...params: Array<any>): void {
    logMore(null, severity, messageOrFormat, ...params);
}

export function logInfo(messageOrFormat: string, ...params: Array<any>) {
    log(Severity.Information, messageOrFormat, ...params);
}

export function logVerbose(messageOrFormat: string, ...params: Array<any>) {
    log(Severity.Verbose, messageOrFormat, ...params);
}

export function logWarning(messageOrFormat: string, ...params: Array<any>) {
    log(Severity.Warning, messageOrFormat, ...params);
}

export function logError(messageOrFormat: string, ...params: Array<any>) {
    log(Severity.Error, messageOrFormat, ...params);
}

export function logCritical(messageOrFormat: string, ...params: Array<any>) {
    log(Severity.Critical, messageOrFormat, ...params);
}

export function logException(exception: Error, properties?: IDictionary<string>): void {
    properties = generateProperties(properties);
    foreachLogger((logger) => logger.logException(properties, exception));
}

export function logEvent(name: string, properties?: IDictionary<string>) {
    if (!util.isString(name)) {
        return;
    }

    properties = generateProperties(properties);
    foreachLogger((logger) => logger.log(properties, Severity.Event, name));
}

export function logMetric(name: string, value?: number, properties?: IDictionary<string>): void {
    if (!util.isString(name)) {
        return;
    }

    if (!util.isNumber(value)) {
        value = 1;
    }

    properties = generateProperties(properties);
    foreachLogger((logger) => logger.logMetric(properties, name, value));
}

export function getLogger(name: string): ILogger {
    if (!util.isString(name)) {
        throw error("name must be supplied.");
    }

    return loggers[name];
}

export function removeLogger(name: string): void {
    if (!util.isString(name)) {
        throw error("name must be supplied.");
    }

    delete loggers[name];
}

export function setLogger(name: string, logger: ILogger): void {
    if (!util.isString(name) || name.trim() === "") {
        throw error("name must be supplied.");
    }

    if (util.isNullOrUndefined(logger)) {
        throw error("logger must be supplied.");
    }

    loggers[name] = logger;
}

export function getLoggerSettings(name: string): ILoggerSettings {
    if (!util.isString(name)) {
        throw error("name must be supplied.");
    }

    return settings.default.get("logging/loggers/" + name);
}
