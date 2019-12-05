import { DataService } from 'src/app/services/data.service';
import { Injector } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DeployedApplication } from 'src/app/Models/DataModels/DeployedApplication';

export class DeployedAppBaseController extends BaseController {
    nodeName: string;
    appId: string;
  
    deployedApp: DeployedApplication;

    constructor(protected data: DataService, injector: Injector) { 
      super(injector);
    }
  
    common(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getDeployedApplication(this.nodeName, this.appId, true, messageHandler).pipe(map( deployedApp => {
        this.deployedApp = deployedApp;
      }));
    }
    
    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.appId = IdUtils.getAppId(route);
    }
}