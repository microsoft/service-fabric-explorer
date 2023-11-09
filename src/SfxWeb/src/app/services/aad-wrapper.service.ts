import { Inject, Injectable } from '@angular/core';
import { Observable, Subject, Subscriber, of } from 'rxjs';
import { AadConfigService } from '../modules/msal-dynamic-config/config-service.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, PopupRequest, InteractionRequiredAuthError, ServerError, AuthError, SilentRequest, AuthenticationResult } from '@azure/msal-browser';
import { filter, map, mergeMap, catchError } from 'rxjs/operators';

/*
Wrapping around the config service in the MSAL module.
This is done to make dependency easier given we are trying to avoid http interceptor issues and circular dependency
but not bloat other components by wrapping over the MSAL services here.
*/

/*
auth workflow

First check if there is an ADAL redirect callback
 - If there is one set the app to use Adal mode and finish the auth flow

If there is no adal redirect in the url then start the msal redirect auth flow
 - If there is an error on redirect check if it is the spa redirect incorrect configuration error.
   This error tells us we should fall back to adal because the WEB redirect is currently configured
    - attempt an adal login path which should restart sfx load and move us to adal redirect path

  - If no redirect then attempt a msal login path if no local accounts


*/

export interface IUserInfo {
  roles: string[];
  user: string;
}

@Injectable({
  providedIn: 'root'
})
export class AadWrapperService {

  public user: IUserInfo;

  private silentRequest: SilentRequest;

  constructor(private aadConfigService: AadConfigService,
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration) { }

  init(): Observable<any> {

    this.silentRequest = {
      scopes: [`${this.aadConfigService.getCluster()}/.default`],
      authority: this.aadConfigService.getAuthority()
    }
    if (!this.aadEnabled) {
      return of(null);
    }
    return this.msalService.handleRedirectObservable().pipe(
      catchError(err => {
        return of(true);
      }),
      mergeMap((value) => this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          mergeMap(() => {
            if (this.msalService.instance.getAllAccounts().length === 0) {
              return this.loginMsal();
            } else {
              this.checkAndSetActiveAccountMsal();
              return of(null)
            }
          }))))

  }

  checkAndSetActiveAccountMsal(){
    /**
     * If no active account set but there are accounts signed in, sets first account to active account
     */
    const activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      const accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
    }

    const user = this.msalService.instance.getActiveAccount();
    this.user = {
      user: user.name,
      roles: user?.idTokenClaims?.roles || []
    }
  }

  loginMsal() {
    return this.msalService.loginRedirect({...this.msalGuardConfig.authRequest} as PopupRequest);
  }

  logout() {
    this.msalService.logoutRedirect();
  }

  public get aadEnabled() {
    return this.aadConfigService.aadEnabled;
  }

  public acquireToken() {
    return this.acquireTokenMsal();
  }

  acquireTokenMsal() {
    return this.msalService.acquireTokenSilent(this.silentRequest).pipe(
      map(tokenInfo => {
        return tokenInfo.accessToken
      }),
      catchError(err => {
      if (err instanceof InteractionRequiredAuthError) {
        return this.loginMsal();
      }
    }))
  }
}
