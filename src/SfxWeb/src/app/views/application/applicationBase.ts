import { Application } from 'src/app/Models/DataModels/Application';
import { DataService } from 'src/app/services/data.service';
import { Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';

export class ApplicationBaseController extends BaseController {
    appTypeName: string;
    appId: string;
  
    app: Application;
  
    constructor(protected data: DataService, injector: Injector) { 
      super(injector);
    }
  
    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getApp(this.appId, true, messageHandler).pipe(map(data => {
          console.log("test")
            this.app = data;

            // return this.data.clusterManifest.ensureInitialized().pipe(mergeMap(() => {
            //   if(this.data.clusterManifest.isBackupRestoreEnabled) {
            //     return this.app.applicationBackupConfigurationInfoCollection.refresh(messageHandler).pipe(catchError( () => of(null)));
            //   }else{
            //     return of(null);
            //   }
            // }));
        }));
    }
    
    getParams(route: ActivatedRouteSnapshot): void {
      this.appId = IdUtils.getAppId(route);
      this.appTypeName = IdUtils.getAppTypeName(route);
    }
  
  }