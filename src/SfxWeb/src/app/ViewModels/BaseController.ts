import { OnDestroy, OnInit, Injector } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { ActivatedRoute, Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { map, filter, tap } from 'rxjs/operators';

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

             this.subscriptions.add(this.refresh().pipe(tap()).subscribe());
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
        return of();
    }

}