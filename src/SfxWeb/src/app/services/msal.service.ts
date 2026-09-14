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
  AuthError,
  ServerError,
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
  public authError: string | null = null;
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
      const context = new PublicClientApplication(config);

      // Only expose the context and enable auth after initialize() resolves; otherwise the
      // interceptor would call acquireTokenSilent on an uninitialized MSAL context.
      return from(context.initialize()).pipe(map(() => {
        this.context = context;
        this.aadEnabled = true;
        return this.context;
      }));
    }));
  }

  login(): Promise<void> {
    const request: RedirectRequest = { scopes: this.scopes };
    return this.context.loginRedirect(request);
  }

  // Completes a redirect sign-in when returning from AAD. Must run before the router boots
  // (HashLocationStrategy) so the "#code=..." response is consumed before it's read as a route.
  async handleWindowCallback(): Promise<void> {
    try {
      const response = await this.context.handleRedirectPromise();
      if (response) {
        this.context.setActiveAccount(response.account);
      } else if (!this.context.getActiveAccount()) {
        const cached = this.context.getAllAccounts()[0];
        if (cached) {
          this.context.setActiveAccount(cached);
        }
      }
    } catch (e) {
      this.authError = this.describeAuthError(e);
      console.error(e);
    }
  }

  // AADSTS9002326 is returned by the /token call when the reply URL is registered under "Web"
  // instead of "Single-page application"; MSAL surfaces it as a ServerError with errorNo 9002326.
  private describeAuthError(e: unknown): string {
    const redirectUri = window.location.origin + window.location.pathname;

    if (e instanceof ServerError && String(e.errorNo) === '9002326') {
      return `Sign-in could not complete. This cluster's Microsoft Entra app registration has the `
        + `Service Fabric Explorer reply URL "${redirectUri}" registered under the "Web" platform, but `
        + `browser sign-in requires it under "Single-page application". In the Azure portal, open the app `
        + `registration (client id ${this.config.raw.metadata.cluster}) -> Authentication, add "${redirectUri}" `
        + `as a Single-page application redirect URI, then reload.`;
    }

    const errorCode = e instanceof AuthError ? e.errorCode : undefined;
    return `Sign-in failed${errorCode ? ` (${errorCode})` : ''}. Reload to try again.`;
  }

  logout(): void {
    this.context.logoutRedirect();
  }

  get authContext(): PublicClientApplication {
    return this.context;
  }

  public get userInfo(): AccountInfo | undefined {
    return this.context.getActiveAccount() ?? this.context.getAllAccounts()[0];
  }

  public get isAuthenticated(): boolean {
    return !!this.userInfo;
  }

  // Silent-only token acquisition; MSAL renews from the cached refresh token. Interactive
  // re-auth is not triggered here so concurrent requests can't each fire a full-page redirect.
  public acquireTokenResilient(resource: string): Observable<string> {
    const request: SilentRequest = {
      scopes: [`${resource}/.default`],
      account: this.userInfo,
    };

    return from(this.context.acquireTokenSilent(request).then(result => result.accessToken)).pipe(retry(3));
  }
}
