//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.logging" {
    import { IDictionary, IDisposable } from "sfx";

    export type Severity = "event" | "verbose" | "info" | "warning" | "error" | "critical";

    export interface ILogger extends IDisposable {
        readonly name: string;

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

    export interface ILog extends IDisposable {
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

        removeLogger(name: string): ILogger;
        addLogger(logger: ILogger): void;
    }
}

declare module "sfx" {
    import { ILog, ILoggerSettings, ILogger } from "sfx.logging";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "log"): Promise<ILog>;
        getComponentAsync(componentIdentity: "loggers.console", loggerSettings: ILoggerSettings, targetConsole?: Console): Promise<ILogger>;
        getComponentAsync(componentIdentity: "loggers.app-insights", loggerSettings: ILoggerSettings): Promise<ILogger>;
    }
}
