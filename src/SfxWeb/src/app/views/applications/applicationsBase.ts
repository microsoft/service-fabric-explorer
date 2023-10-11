import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { ApplicationCollection, IAppTypeUsage } from 'src/app/Models/DataModels/collections/Collections';

@Directive()
export class ApplicationsBaseControllerDirective extends BaseControllerDirective {

    apps: ApplicationCollection;
    usage: IAppTypeUsage;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return forkJoin([
          this.data.getApps(true, messageHandler).pipe(map(apps => {
            this.apps = apps;
          })),

          this.data.appTypeGroups.ensureInitialized(true, messageHandler).pipe(mergeMap(() => {
            return this.data.appTypeGroups.getAppTypeUsage().pipe(map(usage => {
              this.usage = usage;
            }))
          }))
        ]);
    }
  }
