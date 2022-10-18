import { Injectable } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of, Subject, ReplaySubject } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import AuthenticationContext, { Options } from 'adal-angular';
import { StringUtils } from '../Utils/StringUtils';
import { UserAgentApplication, Configuration, AuthenticationParameters } from "msal";
import _ from 'cypress/types/lodash';

@Injectable({
  providedIn: 'root'
})
export class AdalService {
  private context: UserAgentApplication;
  public config: AadMetadata;
  public aadEnabled = false;

  constructor(private http: RestClientService) { }

  load(): Observable<UserAgentApplication> {
    if (!!this.context){
      return of(this.context);
    }else{
      return this.http.getAADmetadata().pipe(map(data => {
        this.config = data;
        if (data.isAadAuthType){

          const config: Configuration = {
            auth: {
              clientId:  data.raw.metadata.cluster,
              authority: data.raw.metadata.tenant,
            },
            // tenant: data.raw.metadata.tenant,
            // clientId: data.raw.metadata.cluster,
            // cacheLocation: 'localStorage'
          };

          // if (data.raw.metadata.login) {
          //   config.instance = StringUtils.EnsureEndsWith(data.raw.metadata.login, '/');
          // }

          // this.context = new AuthenticationContext(config);
          this.context = new UserAgentApplication(config);
          this.context.handleRedirectCallback((err, tokenResponse) => {
            // let accountObj = null;
            // if (tokenResponse !== null) {
            //   accountObj = tokenResponse.account;
            //   // const id_token = tokenResponse.idToken;
            //   // const access_token = tokenResponse.accessToken;
            // } else {
            //   const currentAccounts = this.context.getAllAccounts();
            //   if (!currentAccounts || currentAccounts.length === 0) {
            //     // No user signed in
            //     return;
            //   } else if (currentAccounts.length > 1) {
            //     // More than one user signed in, find desired user with getAccountByUsername(username)
            //   } else {
            //     accountObj = currentAccounts[0];
            //   }
            // }

            // const username = accountObj.username;

          })

        this.aadEnabled = true;

          return this.context;
        }
      }));
    }
  }

  login() {
    this.context.loginRedirect();
  }
  logout() {
      this.context.logout()
  }
  get authContext() {
      return this.context;
  }

  public get userInfo() {
      return this.context.getAccount();
  }

  public get isAuthenticated(): boolean {
    const currentAccounts = this.context.getAllAccounts();
    return !currentAccounts || currentAccounts.length === 0;
  }

  public isCallback(hash: string) {
      return this.context.isCallback(hash);
  }

  public async acquireToken(resource: string) {
    const authParams: AuthenticationParameters = {
      authority: resource
    }
    try {
      return await this.context.acquireTokenSilent(authParams);
    }catch(e) {
      return await this.context.acquireTokenPopup(authParams);
    }
  }

  public acquireTokenResilient(resource: string): Observable<any> {
    return new Observable<any>((subscriber: Subscriber<any>) => {
        this.acquireToken(resource).then(auth => {
          subscriber.next(auth.idToken);
          subscriber.complete();
        }, err => {
          subscriber.error(err);
          subscriber.complete();
        })
    }).pipe(retry(3));
  }
}
