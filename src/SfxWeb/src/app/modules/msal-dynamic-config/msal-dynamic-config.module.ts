import { NgModule, APP_INITIALIZER } from '@angular/core';
import {
  IPublicClientApplication, PublicClientApplication,
  InteractionType, BrowserCacheLocation, LogLevel
} from '@azure/msal-browser';
import {
  MsalGuard, MsalBroadcastService,
  MsalModule, MsalService,
  MSAL_GUARD_CONFIG, MSAL_INSTANCE,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import { AadConfigService } from './config-service.service';
import { Utils } from 'src/app/Utils/Utils';

export function initializerFactory(env: AadConfigService): any {
  return () => env.init();
}

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export function MSALInstanceFactory(config: AadConfigService): IPublicClientApplication {
  const client = new PublicClientApplication({
    auth: {
      clientId: config.getCluster(),
      authority: config.getAuthority(),
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: Utils.isIE
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
  });
  return client;
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { interactionType: InteractionType.Redirect };
}

@NgModule({
  providers: [
  ],
  imports: [MsalModule]
})
export class MsalConfigDynamicModule {

  static forRoot() {
    return {
      ngModule: MsalConfigDynamicModule,
      providers: [
        AadConfigService,
        {
          provide: APP_INITIALIZER, useFactory: initializerFactory,
          deps: [AadConfigService], multi: true
        },
        {
          provide: MSAL_INSTANCE,
          useFactory: MSALInstanceFactory,
          deps: [AadConfigService]
        },
        {
          provide: MSAL_GUARD_CONFIG,
          useFactory: MSALGuardConfigFactory,
          deps: [AadConfigService]
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService,
      ]
    };
  }
}
