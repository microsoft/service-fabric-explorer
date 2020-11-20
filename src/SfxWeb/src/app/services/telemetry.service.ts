import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { Router, NavigationEnd, ActivatedRoute, ActivationEnd } from '@angular/router';
import { StorageService } from './storage.service';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import { TelemetrySnackBarComponent } from '../telemetry-snack-bar/telemetry-snack-bar.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {

  appInsights: ApplicationInsights;
  telemetryEnabled: boolean = true;
  static readonly localStorageKey = "sfx-telemetry-enabled";
  static readonly localStoragePromptedTelemetryKey = "sfx-telemetry-prompted";

  constructor(public routing: Router, private storage: StorageService, private snackBar: MatSnackBar) {

    this.telemetryEnabled = this.storage.getValueBoolean(TelemetryService.localStorageKey, true);
    if(!this.storage.getValueBoolean(TelemetryService.localStoragePromptedTelemetryKey, false)) {
      const config = new MatSnackBarConfig();
      config.duration = 30000;
      this.snackBar.openFromComponent(TelemetrySnackBarComponent, config);
      this.storage.setValue(TelemetryService.localStoragePromptedTelemetryKey, true);
    }

    //enable telemetry
    this.appInsights = new ApplicationInsights({ config: {
      instrumentationKey: environment.telemetryKey,
      isCookieUseDisabled: true,
      disableAjaxTracking: true,
      disableFetchTracking : true,
      disableTelemetry: !this.telemetryEnabled && !!environment.telemetryKey
      /* ...Other Configuration Options... */
    } });

    this.appInsights.loadAppInsights();

    //there can be multiple activationEnd events so we want to grab the last one.
    let lastActivationEnd = null;
    this.routing.events.subscribe( event => {
      if(event instanceof ActivationEnd) {
        lastActivationEnd = event;
      }
        if(event instanceof NavigationEnd){
          try {
            const name = lastActivationEnd.snapshot.routeConfig.path;
            this.trackPageEvent(name);
          }catch {

          }
            lastActivationEnd = null;
        }
    })
   }

   public SetTelemetry(state: boolean) {
    this.storage.setValue(TelemetryService.localStorageKey, state);
    this.telemetryEnabled = state;
    this.appInsights.config.disableTelemetry = !state;
  }

  trackActionEvent(name: string, source: string, data: any) {
  }

  trackPageEvent(name: string) {
    this.appInsights.trackPageView({
      name
    })
  }

}