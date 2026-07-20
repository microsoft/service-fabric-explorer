import { Injectable, ErrorHandler, inject } from '@angular/core';
import { TelemetryService } from './services/telemetry.service';

@Injectable()
export class AppInsightsErrorHandler implements ErrorHandler {
private telemetry = inject(TelemetryService);


    handleError(error) {
        console.error(error);
        this.telemetry.appInsights.trackException(error);
    }
}
