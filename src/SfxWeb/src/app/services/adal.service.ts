import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of, Subject } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import * as AuthenticationContext from  "adal-angular";
import { adal } from 'adal-angular';
import { StandaloneIntegration } from '../Common/StandaloneIntegration';
import { StringUtils } from '../Utils/StringUtils';

// declare var AuthenticationContext: adal.AuthenticationContextStatic;
let createAuthContextFn: adal.AuthenticationContextStatic = AuthenticationContext;

export class AdalConfig {
  apiEndpoint: string;
  clientId: string;
  resource: string;
  tenantId: string;
  redirectUri: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdalService {
  private context: adal.AuthenticationContext;
  public config: AadMetadata;
  public aadEnabled: boolean = false;

  private tokenSubject: Subject<any>;

  constructor(private http: RestClientService) { }

  load(): Observable<adal.AuthenticationContext> {
    if(!!this.context){
      return of(this.context);
    }else{
      return this.http.getAADmetadata().pipe(map(data => {
        this.config = data;
        if(data.isAadAuthType){

          const config = {
            tenant: data.raw.metadata.tenant,
            clientId: data.raw.metadata.client,
            redirectUri: data.raw.metadata.redirect, //location,
            cacheLocation: 'localStorage',
            // popUp: true
        }

        if (data.raw.metadata.login) {
          // Set AAD instance URL (only available in service fabric 5.3 CU1 or later)
          // The AAD login instance URL must ends with "/"
          config['instance'] = StringUtils.EnsureEndsWith(data.raw.metadata.login, "/");
      }

        if (StandaloneIntegration.clusterUrl !== "") {
          config.redirectUri = StandaloneIntegration.clusterUrl + "/Explorer/index.html";
          config['postLogoutRedirectUri'] = StandaloneIntegration.clusterUrl + "/Explorer/index.html";
        }
        console.log(config)
        this.context = new createAuthContextFn(config);
          this.aadEnabled = true;
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
      return this.userInfo && this.accessToken;
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
    let newToken = "";
    if(this.tokenSubject) {
      return this.tokenSubject;
    }else{
      this.tokenSubject = new Subject();

      this.context.acquireToken(resource, (message: string, token: string) => {
        console.log(token);
        if (token) {
            this.tokenSubject.next(token);
            newToken = token;
        } else {
            console.error(message)
            this.tokenSubject.error(message);
        }
        this.tokenSubject.complete();
        this.tokenSubject = null;
    })

      // new Observable<any>((subscriber: Subscriber<any>) =>
      //     {
      //       this.context.acquireToken(resource, (message: string, token: string) => {
      //         if (token) {
      //             subscriber.next(token);
      //         } else {
      //             console.error(message)
      //             subscriber.error(message);
      //         }
      //     })
      //     }
      // ).pipe(retry(3));
      console.log(this.tokenSubject, newToken);
      return this.tokenSubject ? this.tokenSubject.asObservable() : of(newToken);
    }
  }

}
