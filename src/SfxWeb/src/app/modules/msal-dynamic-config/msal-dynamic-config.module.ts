import { InjectionToken, NgModule, APP_INITIALIZER } from '@angular/core';
import { IPublicClientApplication, PublicClientApplication,
    InteractionType, BrowserCacheLocation, LogLevel } from '@azure/msal-browser';
import { MsalGuard, MsalInterceptor, MsalBroadcastService,
     MsalInterceptorConfiguration, MsalModule, MsalService,
      MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG,
      MsalGuardConfiguration, MsalRedirectComponent } from '@azure/msal-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConfigServiceService } from './config-service.service';

const AUTH_CONFIG_URL_TOKEN = new InjectionToken<string>('AUTH_CONFIG_URL');

export function initializerFactory(env: ConfigServiceService, configUrl: string): any {
    // APP_INITIALIZER, except a function return which will return a promise
    // APP_INITIALIZER, angular doesnt starts application untill it completes
    const promise = env.init().then((value) => {
        console.log('finished getting configurations dynamically.');
    });
    return () => promise;
}

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1; // Remove this line to use Angular Universal

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}
export function MSALInstanceFactory(config: ConfigServiceService): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: config.metaData.metadata.cluster,
      authority:  config.metaData.metadata.authority,
      redirectUri: config.metaData.metadata.redirect,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
    })
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap
  };
}

  export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return { interactionType: InteractionType.Popup };
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
              ConfigServiceService,
                { provide: APP_INITIALIZER, useFactory: initializerFactory,
                     deps: [ConfigServiceService], multi: true },
                {
                    provide: MSAL_INSTANCE,
                    useFactory: MSALInstanceFactory,
                    deps: [ConfigServiceService]
                },
                {
                    provide: MSAL_GUARD_CONFIG,
                    useFactory: MSALGuardConfigFactory,
                    deps: [ConfigServiceService]
                },
                {
                    provide: MSAL_INTERCEPTOR_CONFIG,
                    useFactory: MSALInterceptorConfigFactory,
                    deps: [ConfigServiceService]
                },
                MsalService,
                MsalGuard,
                MsalBroadcastService,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: MsalInterceptor,
                    multi: true
                }
            ]
        };
    }
}
