import { HttpRequest, HttpInterceptor, HttpHandler, HttpEvent, HTTP_INTERCEPTORS, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { Observable } from 'rxjs';
import { AdalService } from './services/adal.service';
import { catchError, map } from 'rxjs/operators';
import { DataService } from './services/data.service';
import { Constants } from './Common/Constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private adalService: AdalService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    if(this.adalService.aadEnabled){
        return this.adalService.acquireTokenResilient(this.adalService.config.raw.metadata.cluster)
        .pipe(mergeMap((token) => {
            if (token) {
            req = req.clone({
                setHeaders: {
                Authorization: 'Bearer ' + token
                }
            });
            }
            return next.handle(req);
        }));
    }else{
        return next.handle(req);
    }
  }
}


@Injectable()
export class ReadOnlyHeaderInterceptor implements HttpInterceptor {
  constructor(private dataService: DataService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
        return next.handle(req).pipe(map(res => {
            if (event instanceof HttpResponse) {

                if(event.headers.get(Constants.SfxReadonlyHeaderName)) {
                    this.dataService.readOnlyHeader = event.headers.get(Constants.SfxReadonlyHeaderName) === "1";
                }

                if(event.headers.get(Constants.SfxClusterNameMetadataName)) {
                    this.dataService.clusterNameMetadata = event.headers.get(Constants.SfxClusterNameMetadataName);
                }

              }
            return res;
        }))
  }
}


/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ReadOnlyHeaderInterceptor, multi: true },
];