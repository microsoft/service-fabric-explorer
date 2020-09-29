import { Application } from 'src/app/Models/DataModels/Application';
import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Directive()
export class ApplicationBaseControllerDirective extends BaseControllerDirective {
    appTypeName: string;
    appId: string;

    app: Application;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getApp(this.appId, true, messageHandler).pipe(map(data => {
            this.app = data;
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
      this.appId = IdUtils.getAppId(route);
      this.appTypeName = IdUtils.getAppTypeName(route);
    }

  }
