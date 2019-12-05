import { OnDestroy, OnInit, Injector } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { ActivatedRoute, Router, ActivatedRouteSnapshot } from '@angular/router';
import { mergeMap } from 'rxjs/operators';

export abstract class BaseController implements  OnInit, OnDestroy {

    subscriptions: Subscription = new Subscription();

    activatedRoute: ActivatedRoute;
    router: Router;

    constructor(public injector: Injector) {}

    
    ngOnInit(){
         this.activatedRoute = this.injector.get<ActivatedRoute>(ActivatedRoute);

         this.router = this.injector.get<Router>(Router);
         this.subscriptions.add(this.activatedRoute.params.subscribe( () => {
             //get params
             this.getParams(this.activatedRoute.snapshot);

             this.setup();

             this.subscriptions.add(this.common().pipe(mergeMap( () => this.refresh())).subscribe());
         }))
    }

    setup(){

    }

    ngOnDestroy(){
        this.subscriptions.unsubscribe();
    }

    getParams(route: ActivatedRouteSnapshot): void {

    }

    refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
        return of(null);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any>{
        return of(null);
    }
}