import { Injectable } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of, from } from 'rxjs';
import { retry, map, switchMap } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import { PublicClientApplication, Configuration, AccountInfo, SilentRequest, RedirectRequest } from '@azure/msal-browser';
import { StringUtils } from '../Utils/StringUtils';

@Injectable({
  providedIn: 'root'
})
export class AdalService {
  private context: PublicClientApplication;
  public config: AadMetadata;
  public aadEnabled = false;
  private scopes: string[] = [];

  constructor(private http: RestClientService) { }

  load(): Observable<PublicClientApplication> {
    if (!!this.context){
      return of(this.context);
    }else{
      return this.http.getAADmetadata().pipe(switchMap(data => {
        this.config = data;
        if (data.isAadAuthType){

          let authority = `https://login.microsoftonline.com/${data.raw.metadata.tenant}`;
          if (data.raw.metadata.login) {
            authority = StringUtils.EnsureEndsWith(data.raw.metadata.login, '/') + data.raw.metadata.tenant;
          }

          const config: Configuration = {
            auth: {
              clientId: data.raw.metadata.cluster,
              authority,
              redirectUri: window.location.origin + window.location.pathname,
            },
            cache: {
              cacheLocation: 'localStorage'
            }
          };

          this.scopes = [`${data.raw.metadata.cluster}/.default`];
          this.context = new PublicClientApplication(config);
          this.aadEnabled = true;

          return from(this.context.initialize()).pipe(map(() => this.context));
        }
        return of(undefined);
      }));
    }
  }

  login() {
    const loginRequest: RedirectRequest = {
      scopes: this.scopes
    };
    this.context.loginRedirect(loginRequest);
  }

  logout() {
    this.context.logoutRedirect();
  }

  get authContext() {
    return this.context;
  }

  async handleWindowCallback(): Promise<void> {
    const response = await this.context.handleRedirectPromise();
    if (response) {
      this.context.setActiveAccount(response.account);
    }
  }

  public get userInfo(): AccountInfo | null {
    return this.context.getActiveAccount() || this.context.getAllAccounts()[0] || null;
  }

  public get isAuthenticated(): boolean {
    return !!this.userInfo;
  }

  public acquireTokenResilient(resource: string): Observable<any> {
    const account = this.userInfo;
    if (!account) {
      return new Observable<any>((subscriber: Subscriber<any>) => {
        subscriber.error('No authenticated account found');
        subscriber.complete();
      });
    }

    const silentRequest: SilentRequest = {
      scopes: this.scopes,
      account
    };

    return from(this.context.acquireTokenSilent(silentRequest).then(response => response.accessToken)).pipe(retry(3));
  }
}
