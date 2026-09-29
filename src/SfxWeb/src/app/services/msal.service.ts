import { Injectable, inject } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, defer, from, of, throwError } from 'rxjs';
import { retry, map, switchMap, catchError } from 'rxjs/operators';
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
  InteractionRequiredAuthError,
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
  public authErrorCode: string | null = null;
  private scopes: string[] = [];
  private redirectInProgress = false;

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
      // Report only the error code; the auth-error component renders the matching guidance.
      if (e instanceof ServerError && e.errorNo) {
        this.authErrorCode = String(e.errorNo);
      } else if (e instanceof AuthError) {
        this.authErrorCode = e.errorCode;
      } else {
        this.authErrorCode = 'unknown';
      }
      console.error(e);
    }
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

  // Silent-first token acquisition. Transient failures are retried, but when
  // interaction is required (expired/revoked session) we skip the pointless retries and fall
  // back to a single guarded interactive redirect so concurrent requests can't each fire one.
  public acquireTokenResilient(resource: string): Observable<string> {
    const request: SilentRequest = {
      scopes: [`${resource}/.default`],
      account: this.userInfo,
    };

    return defer(() => this.context.acquireTokenSilent(request)).pipe(
      map(result => result.accessToken),
      retry({
        count: 3,
        delay: (error) => (error instanceof InteractionRequiredAuthError ? throwError(() => error) : of(error)),
      }),
      catchError((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          this.reauthenticate(request);
        }
        return throwError(() => error);
      }),
    );
  }

  // Interactive fallback when silent acquisition can't recover. Guarded so multiple in-flight
  // requests failing at once don't each start a full-page redirect.
  private reauthenticate(request: SilentRequest): void {
    if (this.redirectInProgress) {
      return;
    }
    this.redirectInProgress = true;
    this.context.acquireTokenRedirect({ scopes: request.scopes, account: request.account })
      .catch(() => { this.redirectInProgress = false; });
  }
}
