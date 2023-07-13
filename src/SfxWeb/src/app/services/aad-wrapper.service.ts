import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AadConfigService } from '../modules/msal-dynamic-config/config-service.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, PopupRequest, InteractionRequiredAuthError } from '@azure/msal-browser';
import { filter, map, mergeMap, catchError } from 'rxjs/operators';
import { AccountInfo } from '@azure/msal-common';
/*
Wrapping around the config service in the MSAL module.
This is done to make dependency easier given we are trying to avoid http interceptor issues and circular dependency
but not bloat other components by wrapping over the MSAL services here.
*/

@Injectable({
  providedIn: 'root'
})
export class AadWrapperService {

  public user: AccountInfo;

  constructor(private aadConfigService: AadConfigService,
              private msalService: MsalService,
              private msalBroadcastService: MsalBroadcastService,
              @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration) { }

  init(): Observable<any> {
    if (this.aadEnabled) {
      return this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None)
        )
        .pipe(mergeMap((status) => {
          if (this.msalService.instance.getAllAccounts().length === 0) {
            return this.login();
          } else {
            this.checkAndSetActiveAccount();
            return of(null)
          }
        }))
    } else {
      return of(null);
    }
  }

  checkAndSetActiveAccount(){
    /**
     * If no active account set but there are accounts signed in, sets first account to active account
     */
    const activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      const accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
    }

    this.user = this.msalService.instance.getActiveAccount();
  }

  login() {
    return this.msalService.loginRedirect({...this.msalGuardConfig.authRequest} as PopupRequest)
  }

  logout() {
    this.msalService.logoutRedirect();
  }

  public get aadEnabled() {
    return this.aadConfigService.aadEnabled;
  }

  public acquireToken() {
    return this.msalService.acquireTokenSilent({
      scopes: [`${this.aadConfigService.getCluster()}/.default`],
      authority: this.aadConfigService.getAuthority()
    }).pipe(catchError(err => {
      if (err instanceof InteractionRequiredAuthError) {
        return this.login();
      }
    }))
  }
}
