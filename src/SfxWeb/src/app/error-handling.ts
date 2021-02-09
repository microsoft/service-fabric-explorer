import { Injectable, ErrorHandler } from '@angular/core';
import { TelemetryService } from './services/telemetry.service';

@Injectable()
export class AppInsightsErrorHandler implements ErrorHandler {
constructor(private telemetry: TelemetryService) {}

    handleError(error) {
        this.telemetry.appInsights.trackException(error);
        console.error(error);
    }
}
