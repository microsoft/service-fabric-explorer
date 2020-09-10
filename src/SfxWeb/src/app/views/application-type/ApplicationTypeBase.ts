import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';

@Directive()
export class ApplicationTypeBaseController extends BaseController {
    appTypeName: string;
    appTypeGroup: ApplicationTypeGroup;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getAppTypeGroup(this.appTypeName, true, messageHandler).pipe(map( appTypeGroup => {
            this.appTypeGroup = appTypeGroup;
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
      this.appTypeName = IdUtils.getAppTypeName(route);
    }

  }
