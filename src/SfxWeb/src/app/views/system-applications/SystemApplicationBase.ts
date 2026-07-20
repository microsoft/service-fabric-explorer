import { DataService } from 'src/app/services/data.service';
import { Directive, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { ListSettings } from 'src/app/Models/ListSettings';

@Directive()
export class ServiceApplicationsBaseControllerDirective extends BaseControllerDirective {
    protected data = inject(DataService);

    systemApp: SystemApplication;
    listSettings: ListSettings;
    unhealthyEvaluationsListSettings: ListSettings;

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getSystemApp(true, messageHandler).pipe(map(systemApp => {
            this.systemApp = systemApp;
            // Don't need to refresh the systemApp.health here because it is done in data.getSystemApp already.
        }));
    }

}
