import { NgModule, APP_INITIALIZER } from '@angular/core';
import {
  IPublicClientApplication, PublicClientApplication,
  InteractionType, BrowserCacheLocation
} from '@azure/msal-browser';
import {
  MsalGuard, MsalInterceptor, MsalBroadcastService,
  MsalInterceptorConfiguration, MsalModule, MsalService,
  MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AadConfigService } from './config-service.service';
import { Utils } from 'src/app/Utils/Utils';

export function initializerFactory(env: AadConfigService): any {
  // const promise = env.init().then(() => {
  //   console.log('finished getting configurations dynamically.');
  // });
  // return () => promise;

  return () => env.init()
}

export function MSALInstanceFactory(config: AadConfigService): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: config.getCluster(),
      authority: config.getAuthority(),
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: Utils.isIE
    },
  });
}

export function MSALInterceptorConfigFactory(config: AadConfigService): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  if(config.aadEnabled) {
    protectedResourceMap.set('/', ['user.read']);
  }
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
        {
          provide: MSAL_INTERCEPTOR_CONFIG,
          useFactory: MSALInterceptorConfigFactory,
          deps: [AadConfigService]
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
