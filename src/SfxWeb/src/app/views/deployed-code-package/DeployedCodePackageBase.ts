import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DeployedCodePackage } from 'src/app/Models/DataModels/DeployedCodePackage';

@Directive()
export class DeployedCodePackageBaseController extends BaseController {
    serviceId: string;
    activationId: string;
    appId: string;
    nodeName: string;
    codePackageName: string;

    deployedCodePackage: DeployedCodePackage;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getDeployedCodePackage(this.nodeName, this.appId, this.serviceId, this.activationId, this.codePackageName, true, messageHandler)
        .pipe(map(deployedCodePackage => {
            this.deployedCodePackage = deployedCodePackage;
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.activationId = IdUtils.getServicePackageActivationId(route);
        this.appId = IdUtils.getAppId(route);
        this.codePackageName = IdUtils.getCodePackageName(route);
    }
}
