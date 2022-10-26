import { Injectable } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of, Subject, ReplaySubject } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import AuthenticationContext, { Options } from 'adal-angular';
import { StringUtils } from '../Utils/StringUtils';
import { UserAgentApplication, Configuration, AuthenticationParameters, Logger, LogLevel, AuthResponse } from "msal";

@Injectable({
  providedIn: 'root'
})
export class AdalService {
  public context: UserAgentApplication;
  public config: AadMetadata;
  public aadEnabled = false;

  private authority: string;
  private scopes: string[] = [];

  private pending: Promise<AuthResponse>;

  constructor(private http: RestClientService) { }

  load(): Observable<UserAgentApplication> {
    if (!!this.context){
      return of(this.context);
    }else{
      return this.http.getAADmetadata().pipe(map(data => {
        this.config = data;
        if (data.isAadAuthType){
          this.scopes = [this.config.raw.metadata.cluster];
          this.authority = `https://login.windows.net/${this.config.raw.metadata.tenant}`

          const config: Configuration = {
            auth: {
              clientId:  data.raw.metadata.cluster,
              authority: this.authority,

              validateAuthority: false,
            },
            cache: {
              cacheLocation: 'localStorage'
            },
            system: {
              logger: new Logger((level , message) => console.log(message))
            }
          };

          console.log(config)

          this.context = new UserAgentApplication(config);

          console.log(this.context)
        this.aadEnabled = true;

          return this.context;
        }
      }));
    }
  }

  async login() {
    const data = await this.context.loginPopup({
      authority: this.authority,
      scopes: [this.config.metadata.cluster],
    });
    console.log(data);
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
    return !!this.context.getAccount();
  }

  public isCallback(hash: string) {
      return this.context.isCallback(hash);
  }

  public async acquireToken(): Promise<AuthResponse> {
    if(this.pending) {
      return this.pending;
    }else{
      this.pending = new Promise(async (resolve, reject) => {
        const authParams: AuthenticationParameters = {
          authority: this.authority,
          scopes: this.scopes
        }
        console.log(authParams)
        let attemptPopup = false;
        try {
          const token = await this.context.acquireTokenSilent(authParams);
          resolve(token);
        }catch(e) {
          console.log(e)
          attemptPopup = true;
        }

        if(attemptPopup) {
          try {
            const token = await this.context.acquireTokenPopup(authParams);
            resolve(token);
          } catch(e) {
            reject(e);
          }
        }
      })

      return this.pending;
    }
  }

  public acquireTokenResilient(): Observable<string> {
    return new Observable<any>((subscriber: Subscriber<string>) => {
        this.acquireToken().then(auth => {
          console.log(auth)
          subscriber.next(auth.idToken.rawIdToken);
          subscriber.complete();
        }).catch(err => {
          console.log(err)
          subscriber.error(err);
          subscriber.complete();
        })
    }).pipe(retry(3));
  }
}
