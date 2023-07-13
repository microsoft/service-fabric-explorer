import { HttpRequest, HttpInterceptor, HttpHandler, HttpEvent, HTTP_INTERCEPTORS, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap } from 'rxjs/operators';
import { DataService } from './services/data.service';
import { Constants } from './Common/Constants';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { IHttpRequest, StandaloneIntegrationService } from './services/standalone-integration.service';
import { AadConfigService } from './modules/msal-dynamic-config/config-service.service';
import { AadWrapperService } from './services/aad-wrapper.service';

/*
The will intercept and allow the modification of every http request going in and out.
*/
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private aadConfigService: AadConfigService, private aadwrapper: AadWrapperService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    if (this.aadConfigService.aadEnabled) {
      return this.aadwrapper.acquireToken().pipe(mergeMap((token) => {
        if (token) {
          req = req.clone({
            setHeaders: {
              Authorization: 'Bearer ' + token.accessToken
            }
          });
        }
        return next.handle(req);
      }));
    } else {
      return next.handle(req);
    }
  }
}

@Injectable()
export class ReadOnlyHeaderInterceptor implements HttpInterceptor {
  constructor(private dataService: DataService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    return next.handle(req).pipe(map(res => {
      if (res instanceof HttpResponse) {
        if (res.headers.has(Constants.SfxReadonlyHeaderName)) {
          this.dataService.readOnlyHeader = (res.headers.get(Constants.SfxReadonlyHeaderName) || res.headers.get(Constants.SfxReadonlyHeaderName.toLowerCase())) === '1';
        }

        if (res.headers.has(Constants.SfxClusterNameHeaderName)) {
          this.dataService.clusterNameMetadata = (res.headers.get(Constants.SfxClusterNameHeaderName) || res.headers.get(Constants.SfxClusterNameHeaderName).toLowerCase());
        }

      }
      return res;
    }));
  }
}

@Injectable()
export class GlobalHeaderInterceptor implements HttpInterceptor {
  constructor() { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let newHeaders = req.headers;
    // ADD ADDITIONAL HEADERS HERE
    newHeaders = newHeaders.append('x-servicefabricclienttype', 'SFX')
      .append('sfx-build', environment.version);

    return next.handle(req.clone({ headers: newHeaders }));
  }
}

@Injectable()
export class StandAloneInterceptor implements HttpInterceptor {
  constructor(private standaloneIntegration: StandaloneIntegrationService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(!this.standaloneIntegration.isStandalone()) {
      return next.handle(req);
    }

    const data: IHttpRequest = {
      url: req.url,
      method: req.method,
      headers: req.headers.keys().map(key => ({name: key, value: req.headers.get(key)})),
      body: req.body
    }

    return new Observable(subscriber => {
      const integration = this.standaloneIntegration.integrationConfig;
      const requestData = integration.passObjectAsString ? JSON.stringify(data) : data;
      const caller = this.standaloneIntegration.getIntegrationCaller();

      const handleResponse = (responseData) => {
        if(integration.passObjectAsString) {
          responseData = JSON.parse(responseData);
        }

        if(responseData.statusCode.toString().startsWith("2")) {
          const httpResponse = new HttpResponse({
            url: req.url,
            status: responseData.statusCode,
            body: responseData.data
          })
          subscriber.next(httpResponse);
          subscriber.complete();
        }else{
          const r = new HttpErrorResponse({
            status: responseData.statusCode,
            statusText: responseData.statusMessage,
            error: responseData.data
          });
          subscriber.error(r);
          subscriber.complete();
        }
      }

      if(integration.handleAsCallBack) {
        try {
          console.log(requestData)
          caller({"data": requestData, "Callback": (response) => {
            handleResponse(response);
          }
        })
        } catch(err) {
          console.log(err)
          const r = new HttpErrorResponse({
            status: 500,
          });
          subscriber.error(r);
          subscriber.complete();
        }
      }else{
        caller(requestData).then((response, res) => {
          handleResponse(response);
        }).catch(err => {
          console.log(err)
          const r = new HttpErrorResponse({
            status: 500,
          });
          subscriber.error(r);
          subscriber.complete();
        });
      }
    });
  }
}

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: StandAloneInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ReadOnlyHeaderInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: GlobalHeaderInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];
