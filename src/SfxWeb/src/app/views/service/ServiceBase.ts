import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Service } from 'src/app/Models/DataModels/Service';

@Directive()
export class ServiceBaseController extends BaseController {
    appId: string;
    serviceId: string;
    appTypeName: string;

    service: Service;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getService(this.appId, this.serviceId, true, messageHandler).pipe(mergeMap(service => {
            this.service = service;
            return forkJoin([
              this.service.health.refresh(messageHandler),
              this.service.description.refresh(messageHandler)
            ]);
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.appId = IdUtils.getAppId(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.appTypeName = IdUtils.getAppTypeName(route);
      }
}
