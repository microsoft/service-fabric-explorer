import { DataService } from 'src/app/services/data.service';
import { Directive, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { Service } from 'src/app/Models/DataModels/Service';

@Directive()
export class ServiceBaseControllerDirective extends BaseControllerDirective {
    protected data = inject(DataService);

    appId: string;
    serviceId: string;
    appTypeName: string;
    service: Service;

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
