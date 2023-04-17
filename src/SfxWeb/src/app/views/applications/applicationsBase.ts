import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { ApplicationCollection } from 'src/app/Models/DataModels/collections/Collections';

@Directive()
export class ApplicationsBaseControllerDirective extends BaseControllerDirective {

    apps: ApplicationCollection;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getApps(true, messageHandler).pipe(map(apps => {
            this.apps = apps;
          }));
    }
  }
