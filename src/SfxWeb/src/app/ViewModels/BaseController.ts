import { OnDestroy, OnInit, Injector, Directive } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
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

            this.subscriptions.add(this.refreshService.refreshSubject.subscribe(() => this.fullRefresh().subscribe()));

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
