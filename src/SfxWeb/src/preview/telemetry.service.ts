import { Injectable } from '@angular/core';

// Replaces the telemetry service only in the snapshot build; no SDK is loaded.
@Injectable({ providedIn: 'root' })
export class TelemetryService {
  static readonly localStorageKey = 'sfx-telemetry-enabled';
  static readonly localStoragePromptedTelemetryKey = 'sfx-telemetry-prompted';
  telemetryEnabled = false;
  appInsights = { trackException: (..._args: any[]) => {} };
  SetTelemetry(_state: boolean) {}
  trackActionEvent(_name: string, _data: any, _uniqueSessionId?: string) {}
  trackPageEvent(_name: string) {}
}
