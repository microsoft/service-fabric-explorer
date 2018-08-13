//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IDictionary } from "sfx.common";
import { Severity, ILogger, ILoggerSettings } from "sfx.logging";

import { TelemetryClient, Contracts } from "applicationinsights";
import { TraceTelemetry, ExceptionTelemetry, MetricTelemetry } from "applicationinsights/out/Declarations/Contracts";

import * as utils from "../../../utilities/utils";
import { Severities } from "../log";

function toAppInsightsSeverity(severity: Severity): Contracts.SeverityLevel {
    switch (severity) {
        case Severities.Critical:
            return Contracts.SeverityLevel.Critical;

        case Severities.Information:
            return Contracts.SeverityLevel.Information;

        case Severities.Warning:
            return Contracts.SeverityLevel.Warning;

        case Severities.Error:
            return Contracts.SeverityLevel.Error;

        case Severities.Verbose:
        default:
            return Contracts.SeverityLevel.Verbose;
    }
}

export default class AppInsightsLogger implements ILogger {
    private readonly _name: string;

    public get name(): Promise<string> {
        return Promise.resolve(this._name);
    }

    private client: TelemetryClient;

    public get disposed(): boolean {
        return this.client === undefined;
    }

    constructor(settings: ILoggerSettings) {
        if (!Object.isObject(settings)) {
            throw new Error("settings must be supplied.");
        }

        this._name = settings.name;
        this.client = new TelemetryClient(settings["instrumentationKey"]);
    }

    public writeAsync(properties: IDictionary<string>, severity: Severity, message: string): Promise<void> {
        this.validateDisposal();

        const telemetry: TraceTelemetry = {
            severity: toAppInsightsSeverity(severity),
            message: message
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackTrace(telemetry);
        
        return Promise.resolve();
    }

    public writeExceptionAsync(properties: IDictionary<string>, error: Error): Promise<void> {
        this.validateDisposal();

        const telemetry: ExceptionTelemetry = {
            exception: error
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackException(telemetry);

        return Promise.resolve();
    }

    public writeMetricAsync(properties: IDictionary<string>, name: string, value: number): Promise<void> {
        this.validateDisposal();
        
        const telemetry: MetricTelemetry = {
            name: name,
            value: value
        };

        if (!utils.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackMetric(telemetry);

        return Promise.resolve();
    }

    public disposeAsync(): Promise<void> {
        this.client = undefined;

        return Promise.resolve();
    }

    private validateDisposal(): void {
        if (this.disposed) {
            throw new Error(`Logger, "${this.name}", already disposed.`);
        }
    }
}
