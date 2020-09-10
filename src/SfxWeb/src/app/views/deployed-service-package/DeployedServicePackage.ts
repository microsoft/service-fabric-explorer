import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DeployedServicePackage } from 'src/app/Models/DataModels/DeployedServicePackage';

@Directive()
export class DeployedServicePackageBaseController extends BaseController {
    public serviceId: string;
    public activationId: string;
    public appId: string;
    public nodeName: string;

    servicePackage: DeployedServicePackage;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getDeployedServicePackage(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
                .pipe(mergeMap(servicePackage => {
                    this.servicePackage = servicePackage;

                    return this.servicePackage.health.refresh(messageHandler);
                }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.activationId = IdUtils.getServicePackageActivationId(route);
        this.appId = IdUtils.getAppId(route);
    }
}
