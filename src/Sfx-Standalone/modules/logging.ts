//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as shell from "donuts.node/shell";
import * as log from "donuts.node/logging";
import { ConsoleLogger } from "donuts.node/logging/loggers/console";
import { ISfxModuleManager } from "sfx.module-manager";
import { ILoggerSettings } from "sfx.logging";
import { TelemetryClient, Contracts } from "applicationinsights";
import { TraceTelemetry, ExceptionTelemetry, MetricTelemetry } from "applicationinsights/out/Declarations/Contracts";
import * as utils from "donuts.node/utils";

interface ILoggingSettings {
    loggers: Array<ILoggerSettings>;
}

interface IAppInsightsLoggerSettings extends ILoggerSettings {
    instrumentationKey: string;
}

class AppInsightsLogger implements Donuts.Logging.ILogger {
    private readonly client: TelemetryClient;

    private static toAppInsightsSeverity(severity: Donuts.Logging.Severity): Contracts.SeverityLevel {
        switch (severity) {
            case "critical":
                return Contracts.SeverityLevel.Critical;

            case "info":
                return Contracts.SeverityLevel.Information;

            case "warning":
                return Contracts.SeverityLevel.Warning;

            case "error":
                return Contracts.SeverityLevel.Error;

            case "verbose":
            default:
                return Contracts.SeverityLevel.Verbose;
        }
    }

    constructor(settings: IAppInsightsLoggerSettings) {
        if (!settings) {
            throw new Error("settings must be supplied.");
        }

        this.client = new TelemetryClient(settings.instrumentationKey);
    }

    public async writeAsync(properties: Donuts.IStringKeyDictionary<string>, severity: Donuts.Logging.Severity, message: string): Promise<this> {
        const telemetry: TraceTelemetry = {
            severity: AppInsightsLogger.toAppInsightsSeverity(severity),
            message: message
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackTrace(telemetry);

        return this;
    }

    public async writeExceptionAsync(properties: Donuts.IStringKeyDictionary<string>, error: Error): Promise<this> {
        const telemetry: ExceptionTelemetry = {
            exception: error
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackException(telemetry);

        return this;
    }

    public async writeMetricAsync(properties: Donuts.IStringKeyDictionary<string>, name: string, value: number): Promise<this> {
        const telemetry: MetricTelemetry = {
            name: name,
            value: value
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackMetric(telemetry);

        return this;
    }
}

(<Donuts.Modularity.IModule>exports).getModuleMetadata = (components): Donuts.Modularity.IModuleInfo => {
    components
        .register<Donuts.Logging.ILog>({
            name: "default",
            version: shell.getAppVersion(),
            descriptor: async () => log.getLog(),
            singleton: true
        })
        .register<Donuts.Logging.ILogger>({
            name: "logger.console",
            version: shell.getAppVersion(),
            descriptor: async (settings?: ILoggerSettings) => new ConsoleLogger(settings),
            singleton: true
        })
        .register<Donuts.Logging.ILogger>({
            name: "logger.app-insights",
            version: shell.getAppVersion(),
            descriptor: async (settings: IAppInsightsLoggerSettings) => new AppInsightsLogger(settings),
            singleton: true
        });

    return {
        name: "logging",
        version: shell.getAppVersion(),
        dependencies: {
            "settings": shell.getAppVersion()
        }
    };
};

(<Donuts.Modularity.IModule>exports).initializeAsync = async (moduleManager: ISfxModuleManager) => {
    const settings = await moduleManager.getComponentAsync("settings.default");
    const loggingSettings = await settings.getAsync<ILoggingSettings>("logging");

    if (!Array.isArray(loggingSettings.loggers)) {
        return;
    }

    const defaultLog = log.getLog();

    for (const loggerSettings of loggingSettings.loggers) {
        const logger = await moduleManager.getComponentAsync(loggerSettings.component, loggerSettings);

        await defaultLog.addLoggerAsync(loggerSettings.name, logger);
    }
};
