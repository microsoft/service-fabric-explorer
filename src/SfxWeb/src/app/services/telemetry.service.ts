// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { StringUtils } from '../Utils/StringUtils';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {

  constructor(private storage: StorageService,
              public routing: Router) {

    this.telemetryEnabled = this.storage.getValueBoolean(TelemetryService.localStorageKey, true);

    // enable telemetry
    this.appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: environment.telemetryKey,
        isCookieUseDisabled: true,
        disableAjaxTracking: true,
        disableFetchTracking: true,
        enableAutoRouteTracking: true,
        disableTelemetry: !this.telemetryEnabled || !environment.telemetryKey
        /* ...Other Configuration Options... */
      }
    });

    this.appInsights.loadAppInsights();
    this.appInsights.context.application.ver = environment.version;

    // there can be multiple activationEnd events so we want to grab the last one.
    let lastActivationEnd = null;
    this.routing.events.subscribe(event => {
      if (event instanceof ActivationEnd) {
        lastActivationEnd = event;
      }
      if (event instanceof NavigationEnd) {
        try {
          let name =  '';
          // build up the URL this way to avoid passing in PII about stuff running in the cluster
          let snapshot = lastActivationEnd.snapshot;
          while (snapshot) {
            const path = snapshot.routeConfig.path;
            if (path.length > 0) {
              name +=  StringUtils.EnsureStartsWith(snapshot.routeConfig.path, '/');
            }
            snapshot = snapshot.firstChild;
          }
          this.trackPageEvent(name);
        } catch {

        }
        lastActivationEnd = null;
      }
    });
  }
  static readonly localStorageKey = 'sfx-telemetry-enabled';
  static readonly localStoragePromptedTelemetryKey = 'sfx-telemetry-prompted';
  private uniqueEmitCache: Set<string> = new Set();

  appInsights: ApplicationInsights;
  telemetryEnabled = true;

  public SetTelemetry(state: boolean) {
    this.storage.setValue(TelemetryService.localStorageKey, state);
    this.telemetryEnabled = state;
    this.appInsights.config.disableTelemetry = !state;
  }

  trackActionEvent(name: string, data: any, uniqueSessionId?: string) {
    if (uniqueSessionId && this.uniqueEmitCache.has(uniqueSessionId)) {
      return;
    }else{
      this.uniqueEmitCache.add(uniqueSessionId);
    }

    this.appInsights.trackEvent({name}, data);
  }

  trackPageEvent(name: string) {

    this.appInsights.trackPageView({
      name
    });
  }

}
