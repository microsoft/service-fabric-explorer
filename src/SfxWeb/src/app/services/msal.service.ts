import { Injectable, inject } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, from, of } from 'rxjs';
import { retry, map, switchMap } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
  SilentRequest,
  RedirectRequest,
  BrowserCacheLocation,
} from '@azure/msal-browser';
import { StringUtils } from '../Utils/StringUtils';

@Injectable({
  providedIn: 'root'
})
export class MsalService {
  private http = inject(RestClientService);

  private context!: PublicClientApplication;
  public config!: AadMetadata;
  public aadEnabled = false;
  private scopes: string[] = [];

  load(): Observable<PublicClientApplication | undefined> {
    if (this.context) {
      return of(this.context);
    }

    return this.http.getAADmetadata().pipe(switchMap(data => {
      this.config = data;
      if (!data.isAadAuthType) {
        return of(undefined);
      }

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
          cacheLocation: BrowserCacheLocation.LocalStorage,
        },
      };

      this.scopes = [`${data.raw.metadata.cluster}/.default`];
      this.context = new PublicClientApplication(config);
      this.aadEnabled = true;

      return from(this.context.initialize()).pipe(map(() => this.context));
    }));
  }

  login(): Promise<void> {
    const request: RedirectRequest = { scopes: this.scopes };
    return this.context.loginRedirect(request);
  }

  // Completes a redirect sign-in when returning from AAD. Must run before the router boots
  // (HashLocationStrategy) so the "#code=..." response is consumed before it's read as a route.
  async handleWindowCallback(): Promise<void> {
    const response = await this.context.handleRedirectPromise();
    if (response) {
      this.context.setActiveAccount(response.account);
    } else if (!this.context.getActiveAccount()) {
      const cached = this.context.getAllAccounts()[0];
      if (cached) {
        this.context.setActiveAccount(cached);
      }
    }
  }

  logout(): void {
    this.context.logoutRedirect();
  }

  get authContext(): PublicClientApplication {
    return this.context;
  }

  public get userInfo(): AccountInfo | null {
    return this.context.getActiveAccount() ?? this.context.getAllAccounts()[0] ?? null;
  }

  public get isAuthenticated(): boolean {
    return !!this.userInfo;
  }

  // Silent-only token acquisition; MSAL renews from the cached refresh token. Interactive
  // re-auth is not triggered here so concurrent requests can't each fire a full-page redirect.
  public acquireTokenResilient(resource: string): Observable<string> {
    const request: SilentRequest = {
      scopes: [`${resource}/.default`],
      account: this.userInfo ?? undefined,
    };

    return from(this.context.acquireTokenSilent(request).then(result => result.accessToken)).pipe(retry(3));
  }
}
