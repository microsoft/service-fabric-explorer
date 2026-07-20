import { OnDestroy, OnInit, Directive, inject } from '@angular/core';
import { Observable, Subscription, interval, of } from 'rxjs';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { ActivatedRoute, Router, ActivatedRouteSnapshot } from '@angular/router';
import { finalize, mergeMap } from 'rxjs/operators';
import { RefreshService } from '../services/refresh.service';
import { MessageService } from '../services/message.service';

@Directive()
export abstract class BaseControllerDirective implements  OnInit, OnDestroy {

  subscriptions: Subscription = new Subscription();

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  refreshService = inject(RefreshService);
  messageService = inject(MessageService);

  // Allow subclass to override the refresh interval instead of using the global refresh interval
  // Primarily used for cluster recovery insights page to give APIs sufficient time to return data during system services quorum loss
  fixedRefreshIntervalMs?: number;


  ngOnInit(){
        this.subscriptions.add(this.activatedRoute.params.subscribe( () => {
            // get params
            this.getParams(this.activatedRoute.snapshot);

            this.setup();

            if (this.fixedRefreshIntervalMs) {
              this.subscriptions.add(interval(this.fixedRefreshIntervalMs).subscribe(() => this.fullRefresh().subscribe()));
            } 
            else {
              this.subscriptions.add(this.refreshService.refreshSubject.subscribe(() => this.fullRefresh().subscribe()));
            }

            this.subscriptions.add(this.fullRefresh().pipe(finalize(() => this.afterDataSet())).subscribe());
      }));

        console.log(this);
  }

  getClassName() {
      return this.constructor.name;
    }

  /*
    Optional to override to implement one time set up logic.

  */
  setup(){

  }
  
  /*
    Optional to override to implement one time set up logic after setup() that needs data.

  */
  afterDataSet() {
    
  }

  ngOnDestroy(){
      this.subscriptions.unsubscribe();
  }

  fullRefresh(): Observable<any> {
    return this.common().pipe(mergeMap(() => this.refresh(this.messageService)));
  }

  /*
    Optional to get and set params from URL. called before common
  */
  getParams(route: ActivatedRouteSnapshot): void {

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
      return of(null);
  }

  common(messageHandler?: IResponseMessageHandler): Observable<any>{
      return of(null);
  }
}
