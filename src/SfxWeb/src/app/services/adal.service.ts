import { Injectable } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of, Subject, ReplaySubject } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import AuthenticationContext, { Options } from 'adal-angular';
import { StringUtils } from '../Utils/StringUtils';

@Injectable({
  providedIn: 'root'
})
export class AdalService {
  private context: AuthenticationContext;
  public config: AadMetadata;
  public aadEnabled = false;

  constructor(private http: RestClientService) { }

  load(): Observable<AuthenticationContext> {
    if (!!this.context){
      return of(this.context);
    }else{
      return this.http.getAADmetadata().pipe(map(data => {
        this.config = data;
        if (data.isAadAuthType){

          const config: Options = {
            tenant: data.raw.metadata.tenant,
            clientId: data.raw.metadata.cluster,
            cacheLocation: 'localStorage'
          };

          if (data.raw.metadata.login) {
            config.instance = StringUtils.EnsureEndsWith(data.raw.metadata.login, '/');
          }

          this.context = new AuthenticationContext(config);
          this.aadEnabled = true;

          return this.context;
        }
      }));
    }
  }

  login() {
    this.context.login();
  }
  logout() {
      this.context.logOut();
  }
  get authContext() {
      return this.context;
  }
  handleWindowCallback() {
      this.context.handleWindowCallback();
  }
  public get userInfo() {

      return this.context.getCachedUser();
  }
  public get accessToken() {
      return this.context.getCachedToken(this.config.raw.metadata.cluster);
  }
  public get isAuthenticated(): boolean {
      return !!this.userInfo && !!this.accessToken;
  }

  public isCallback(hash: string) {
      return this.context.isCallback(hash);
  }

  public getLoginError() {
      return this.context.getLoginError();
  }

  public getAccessToken(endpoint: string, callbacks: (message: string, token: string) => any) {

      return this.context.acquireToken(endpoint, callbacks);
  }

  public acquireTokenResilient(resource: string): Observable<any> {
    return new Observable<any>((subscriber: Subscriber<any>) => {
      this.context.acquireToken(resource, (message: string, token: string) => {
        if (token) {
          subscriber.next(token);
        } else {
          console.error(message);
          subscriber.error(message);
        }
        subscriber.complete();
      });
    }).pipe(retry(3));
  }
}
