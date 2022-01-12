import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AadConfigService } from '../modules/msal-dynamic-config/config-service.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { AuthenticationResult, BrowserUtils, EventMessage, EventType, InteractionStatus, InteractionType, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { filter, map } from 'rxjs/operators';
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
        return new Observable( sub => {
          this.msalBroadcastService.inProgress$
          .pipe(
            filter((status: InteractionStatus) => status === InteractionStatus.None),
          ).pipe(map(() => {
            this.checkAndSetActiveAccount();
            sub.next(true);
            sub.complete();
          })).subscribe();

          this.loginPopup();
        });

      }else{
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

  loginPopup() {
    if (this.msalGuardConfig.authRequest){
      this.msalService.loginPopup({...this.msalGuardConfig.authRequest} as PopupRequest)
        .subscribe((response: AuthenticationResult) => {
          this.msalService.instance.setActiveAccount(response.account);
        });
      } else {
        this.msalService.loginPopup()
          .subscribe((response: AuthenticationResult) => {
            this.msalService.instance.setActiveAccount(response.account);
      });
    }
  }

  logout() {
    this.msalService.logoutRedirect();
  }

  public get aadEnabled() {
    return this.aadConfigService.aadEnabled;
  }
}
