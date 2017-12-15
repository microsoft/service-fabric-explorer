import { TelemetryClient, Contracts } from "applicationinsights";
import { Telemetry, TraceTelemetry, ExceptionTelemetry, MetricTelemetry } from "applicationinsights/out/Declarations/Contracts";
import * as util from "util";

import { Severity, ILoggerSettings, ILogger } from "../log";

function toAppInsightsSeverity(severity: Severity): Contracts.SeverityLevel {
    switch (severity) {
        case Severity.Critical:
            return Contracts.SeverityLevel.Critical;

        case Severity.Information:
            return Contracts.SeverityLevel.Information;

        case Severity.Warning:
            return Contracts.SeverityLevel.Warning;

        case Severity.Error:
            return Contracts.SeverityLevel.Error;

        case Severity.Verbose:
        default:
            return Contracts.SeverityLevel.Verbose;
    }
}

class AppInsightsLogger implements ILogger {
    private readonly client: TelemetryClient;

    constructor(client: TelemetryClient) {
        this.client = client;
    }

    public log(properties: IDictionary<string>, severity: Severity, message: string): void {
        let telemetry: TraceTelemetry = {
            severity: toAppInsightsSeverity(severity),
            message: message
        };

        if (!util.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackTrace(telemetry);
    }

    public logException(properties: IDictionary<string>, error: Error): void {
        let telemetry: ExceptionTelemetry = {
            exception: error
        };

        if (!util.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackException(telemetry);
    }

    public logMetric(properties: IDictionary<string>, name: string, value: number): void {
        let telemetry: MetricTelemetry = {
            name: name,
            value: value
        };

        if (!util.isNullOrUndefined(properties)) {
            telemetry.properties = properties;
        }

        this.client.trackMetric(telemetry);
    }
}

export function create(loggerSettings: ILoggerSettings): ILogger {
    return new AppInsightsLogger(new TelemetryClient(loggerSettings["instrumentationKey"]));
}
