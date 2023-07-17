import { Inject, Injectable } from '@angular/core';
import { Observable, Subscriber, of } from 'rxjs';
import { AadConfigService } from '../modules/msal-dynamic-config/config-service.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, PopupRequest, InteractionRequiredAuthError, ServerError, AuthError } from '@azure/msal-browser';
import { filter, map, mergeMap, catchError } from 'rxjs/operators';
import AuthenticationContext, { Options } from 'adal-angular';
import { StringUtils } from '../Utils/StringUtils';
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

  private adalContext: AuthenticationContext;

  public useAdal = false;
  public user: IUserInfo;

  constructor(private aadConfigService: AadConfigService,
              private msalService: MsalService,
              private msalBroadcastService: MsalBroadcastService,
              @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration) { }

  init(): Observable<any> {
    this.initAdal();
    //TODO consider having a cached value to attempt msal again?
    if (window.location.hash.includes("id_token=") || this.isAdalAuthenticated) {
      this.useAdal = true;
      this.handleWindowCallbackAdal();
      return of(null);
    } else if (this.aadEnabled) {
      return this.msalService.handleRedirectObservable().pipe(
        catchError(err => {
          //dont attempt login here because it has a slight delay which can cause msal to attempt a login after.
          //pass info to tell the next observable step to attempt a adal login.
          if (err instanceof ServerError) {
            if (this.shouldMsalFallbackToAdal(err)) {
              return of(false)
            }
          }
          return of(true);
        }),
        mergeMap((value) => this.msalBroadcastService.inProgress$
          .pipe(
            filter((status: InteractionStatus) => status === InteractionStatus.None),
            mergeMap(() => {
              if(value === false) {
                this.adalContext.login();
                return of(null);
              }
              else if (this.msalService.instance.getAllAccounts().length === 0) {
                return this.loginMsal();
              } else {
                this.checkAndSetActiveAccountMsal();
                return of(null)
              }
            }))))
    } else {
      return of(null);
    }
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
    if(this.useAdal) {
      this.adalContext.logOut();
    }else{
      this.msalService.logoutRedirect();
    }
  }

  public get aadEnabled() {
    return this.aadConfigService.aadEnabled;
  }

  public acquireToken() {
    if(this.useAdal) {
      return this.acquireTokenAdal();
    }else{
      return this.acquireTokenMsal();
    }
  }

  acquireTokenMsal() {
    return this.msalService.acquireTokenSilent({
      scopes: [`${this.aadConfigService.getCluster()}/.default`],
      authority: this.aadConfigService.getAuthority()
    }).pipe(
      map(tokenInfo => {
        return tokenInfo.accessToken
      }),
      catchError(err => {
      if (err instanceof InteractionRequiredAuthError) {
        return this.loginMsal();
      }
      if (this.shouldMsalFallbackToAdal(err)) {
        this.adalContext.login();
        return of(false)
      }
    }))
  }

  shouldMsalFallbackToAdal(err: AuthError) {
    return err.errorMessage.includes("AADSTS9002326");
  }

  initAdal() {
    const config: Options = {
      tenant: this.aadConfigService.metaData.raw.metadata.tenant,
      clientId: this.aadConfigService.getCluster(),
      cacheLocation: 'localStorage'
    };

    if (this.aadConfigService.metaData.raw.metadata.login) {
      config.instance = StringUtils.EnsureEndsWith(this.aadConfigService.metaData.raw.metadata.login, '/');
    }
    this.adalContext = new AuthenticationContext(config);
  }

  public getAccessTokenAdal(endpoint: string, callbacks: (message: string, token: string) => any) {
    return this.adalContext.acquireToken(endpoint, callbacks);
  }

  public acquireTokenAdal(): Observable<any> {
    return new Observable<any>((subscriber: Subscriber<any>) => {
      this.adalContext.acquireToken(this.aadConfigService.metaData.raw.metadata.cluster,
                                (message: string, token: string) => {
        if (token) {
          subscriber.next(token);
        } else {
          console.error(message);
          subscriber.error(message);
        }
        subscriber.complete();
      });
    })
  }

  handleWindowCallbackAdal() {
    this.adalContext.handleWindowCallback();

    const user = this.adalUserInfo();
    this.user = {
      user: user.userName,
      roles: user?.profile?.roles || []
    }
  }

  public adalUserInfo() {
    return this.adalContext.getCachedUser();
  }
  public get adalAccessToken() {
    return this.adalContext.getCachedToken(this.aadConfigService.metaData.metadata.cluster);
  }
  public get isAdalAuthenticated(): boolean {
    return !!this.adalUserInfo && !!this.adalAccessToken;
  }

}
