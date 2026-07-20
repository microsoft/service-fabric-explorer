import { DataService } from 'src/app/services/data.service';
import { Directive, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DeployedApplication } from 'src/app/Models/DataModels/DeployedApplication';

@Directive()
export class DeployedAppBaseControllerDirective extends BaseControllerDirective {
    protected data = inject(DataService);

    nodeName: string;
    appId: string;

    deployedApp: DeployedApplication;

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
      return this.data.getDeployedApplication(this.nodeName, this.appId, true, messageHandler).pipe(mergeMap( deployedApp => {
        this.deployedApp = deployedApp;
        return this.deployedApp.health.refresh(messageHandler);
      }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.appId = IdUtils.getAppId(route);
    }
}
