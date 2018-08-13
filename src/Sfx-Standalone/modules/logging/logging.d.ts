//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

declare module "sfx.logging" {
    import { Component } from "sfx.module-manager";
    import { IDictionary, IDisposable } from "sfx.common";

    export type Severity = "event" | "verbose" | "info" | "warning" | "error" | "critical";

    export interface ILogger extends IDisposable {
        readonly name: Promise<string>;

        writeAsync(properties: IDictionary<string>, severity: Severity, message: string): Promise<void>;
        writeExceptionAsync(properties: IDictionary<string>, error: Error): Promise<void>;
        writeMetricAsync(properties: IDictionary<string>, name: string, value: number): Promise<void>;
    }

    export interface ILoggerSettings extends IDictionary<any> {
        name: string;
        component: string;
    }

    export interface ILoggingSettings {
        logCallerInfo?: boolean;
        loggers?: Array<ILoggerSettings>;
        properties?: IDictionary<string>;
    }

    export interface ILog extends IDisposable {
        writeMoreAsync(properties: IDictionary<string>, severity: Severity, messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeAsync(severity: Severity, messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeInfoAsync(messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeVerboseAsync(messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeWarningAsync(messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeErrorAsync(messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeCriticalAsync(messageOrFormat: string, ...params: Array<any>): Promise<void>;
        writeExceptionAsync(exception: Error, properties?: IDictionary<string>): Promise<void>;
        writeEventAsync(name: string, properties?: IDictionary<string>): Promise<void>;
        writeMetricAsync(name: string, value?: number, properties?: IDictionary<string>): Promise<void>;

        removeLoggerAsync(name: string): Promise<ILogger>;
        addLoggerAsync(logger: ILogger): Promise<void>;
    }
}

declare module "sfx.module-manager" {
    import { ILog, ILoggerSettings, ILogger } from "sfx.logging";

    export interface IModuleManager {
        getComponentAsync(componentIdentity: "logging"): Promise<ILog>;
        getComponentAsync(componentIdentity: "logging.logger.console", loggerSettings: ILoggerSettings, targetConsole?: Console): Promise<ILogger>;
        getComponentAsync(componentIdentity: "logging.logger.app-insights", loggerSettings: ILoggerSettings): Promise<ILogger>;
    }
}
