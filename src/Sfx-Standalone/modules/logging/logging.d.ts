//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.logging" {
    import * as sfx from "sfx";

    export type Severity = "event" | "verbose" | "info" | "warning" | "error" | "critical";

    export interface ILogger {
        write(properties: sfx.IDictionary<string>, severity: Severity, message: string): void;
        writeException(properties: sfx.IDictionary<string>, error: Error): void;
        writeMetric(properties: sfx.IDictionary<string>, name: string, value: number): void;
    }

    export interface ILoggerSettings extends sfx.IDictionary<any> {
        type: string;
    }

    export interface ILoggingSettings {
        logCallerInfo?: boolean;
        loggers?: sfx.IDictionary<ILoggerSettings>;
        properties?: sfx.IDictionary<string>;
    }

    export interface ILog {
        writeMore(properties: sfx.IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): void;
        write(severity: Severity, messageOrFormat: string, ...params: Array<any>): void;
        writeInfo(messageOrFormat: string, ...params: Array<any>): void;
        writeVerbose(messageOrFormat: string, ...params: Array<any>): void;
        writeWarning(messageOrFormat: string, ...params: Array<any>): void;
        writeError(messageOrFormat: string, ...params: Array<any>): void;
        writeCritical(messageOrFormat: string, ...params: Array<any>): void;
        writeException(exception: Error, properties?: sfx.IDictionary<string>): void;
        writeEvent(name: string, properties?: sfx.IDictionary<string>): void;
        writeMetric(name: string, value?: number, properties?: sfx.IDictionary<string>): void;

        setLogger(name: string, logger?: ILogger): void;
        getLogger(name: string): ILogger;
    }
}

declare module "sfx" {
    import * as logging from "sfx.logging";

    export interface IModuleManager {
        getComponent(componentIdentity: "log"): logging.ILog;
        getComponent(componentIdentity: "loggers.console", loggerSettings: logging.ILoggerSettings, targetConsole?: Console): logging.ILogger;
        getComponent(componentIdentity: "loggers.app-insights", loggerSettings: logging.ILoggerSettings): logging.ILogger;
    }
}
