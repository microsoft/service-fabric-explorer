import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { ListSettings } from 'src/app/Models/ListSettings';

@Directive()
export class ServiceApplicationsBaseController extends BaseController {
    systemApp: SystemApplication;
    listSettings: ListSettings;
    unhealthyEvaluationsListSettings: ListSettings;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getSystemApp(true, messageHandler).pipe(map(systemApp => {
            this.systemApp = systemApp;
            // Don't need to refresh the systemApp.health here because it is done in data.getSystemApp already.
        }));
    }

}
