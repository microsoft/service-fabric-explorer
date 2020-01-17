import { HttpRequest, HttpInterceptor, HttpHandler, HttpEvent, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { Observable } from 'rxjs';
import { AdalService } from './services/adal.service';
import { catchError } from 'rxjs/operators';
import { MessageService } from './services/message.service';

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

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];