import { Injectable } from '@angular/core';
import { RestClientService } from './rest-client.service';
import { Observable, Subscriber, of } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { AadMetadata } from '../Models/DataModels/Aad';
import { UserAgentApplication, Configuration, AuthenticationParameters, AuthResponse } from "msal";

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
          this.authority =  this.config.metadata.authority

          const config: Configuration = {
            auth: {
              clientId:  data.raw.metadata.cluster,
              authority: this.authority,
            },
            cache: {
              cacheLocation: 'localStorage'
            }
          };

          this.context = new UserAgentApplication(config);
          this.aadEnabled = true;

          return this.context;
        }
      }));
    }
  }

  async login() {
    return await this.context.loginPopup({
      authority: this.authority,
      scopes: this.scopes,
    });
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
