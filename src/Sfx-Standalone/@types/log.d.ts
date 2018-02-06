//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export type Severity = "event" | "verbose" | "info" | "warning" | "error" | "critical";

export interface ILogger {
    write(properties: IDictionary<string>, severity: Severity, message: string): void;
    writeException(properties: IDictionary<string>, error: Error): void;
    writeMetric(properties: IDictionary<string>, name: string, value: number): void;
}

export interface ILoggerSettings extends IDictionary<any> {
    type: string;
}

export interface ILoggingSettings {
    logCallerInfo?: boolean;
    loggers?: IDictionary<ILoggerSettings>;
    properties?: IDictionary<string>;
}

export interface ILog {
    writeMore(properties: IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): void;
    write(severity: Severity, messageOrFormat: string, ...params: Array<any>): void;
    writeInfo(messageOrFormat: string, ...params: Array<any>): void;
    writeVerbose(messageOrFormat: string, ...params: Array<any>): void;
    writeWarning(messageOrFormat: string, ...params: Array<any>): void;
    writeError(messageOrFormat: string, ...params: Array<any>): void;
    writeCritical(messageOrFormat: string, ...params: Array<any>): void;
    writeException(exception: Error, properties?: IDictionary<string>): void;
    writeEvent(name: string, properties?: IDictionary<string>): void;
    writeMetric(name: string, value?: number, properties?: IDictionary<string>): void;

    setLogger(name: string, logger?: ILogger): void;
    getLogger(name: string): ILogger;
}

declare global {
    interface IModuleManager {
        getComponent(componentIdentity: "log"): ILog;
        getComponent(componentIdentity: "loggers.console", loggerSettings: ILoggerSettings, targetConsole?: Console): ILogger;
        getComponent(componentIdentity: "loggers.app-insights", loggerSettings: ILoggerSettings): ILogger;
    }
}
