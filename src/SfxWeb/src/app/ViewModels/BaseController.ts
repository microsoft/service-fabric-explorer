import { OnDestroy, OnInit, Injector, Directive } from '@angular/core';
import { Observable, Subscription, of, interval } from 'rxjs';
import { IResponseMessageHandler } from '../Common/ResponseMessageHandlers';
import { ActivatedRoute, Router, ActivatedRouteSnapshot } from '@angular/router';
import { finalize, mergeMap } from 'rxjs/operators';
import { RefreshService } from '../services/refresh.service';
import { MessageService } from '../services/message.service';

@Directive()
export abstract class BaseControllerDirective implements  OnInit, OnDestroy {

  subscriptions: Subscription = new Subscription();

  activatedRoute: ActivatedRoute;
  router: Router;
  refreshService: RefreshService;
  messageService: MessageService;

  /**
   * Override in a subclass to use a fixed refresh interval (in milliseconds)
   * instead of the global RefreshService rate.
   */
  protected get refreshIntervalMs(): number | undefined { return undefined; }

  constructor(public injector: Injector) {}


  ngOnInit(){
        this.activatedRoute = this.injector.get<ActivatedRoute>(ActivatedRoute);
        this.refreshService = this.injector.get<RefreshService>(RefreshService);
        this.messageService = this.injector.get<MessageService>(MessageService);
        this.router = this.injector.get<Router>(Router);
        this.subscriptions.add(this.activatedRoute.params.subscribe( () => {
            // get params
            this.getParams(this.activatedRoute.snapshot);

            this.setup();

            if (this.refreshIntervalMs != null) {
              // Fixed interval: bypass the global auto-refresh timer and drive refreshes ourselves.
              // The global refreshSubject is still driven by a 15 s timer, so subscribing to it
              // here would cause refreshes far more often than intended.
              this.subscriptions.add(interval(this.refreshIntervalMs).subscribe(() => this.fullRefresh().subscribe()));
            } else {
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
