import { Component, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';
import { DeployedCodePackage } from 'src/app/Models/DataModels/DeployedCodePackage';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {

  nodeName: string;
  appId: string;
  serviceId: string;
  activationId: string;
  codePackageName: string;

  deployedCodePackage: DeployedCodePackage;

  constructor(private data: DataService, injector: Injector) {
    super(injector);
  }


  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getDeployedCodePackage(this.nodeName, this.appId,this.serviceId, this.activationId, this.codePackageName, true, messageHandler).pipe(map( deployedCodePackage => {
        this.deployedCodePackage = deployedCodePackage;
      }));
  }


  setup(){
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.nodeName = IdUtils.getNodeName(route);
    this.appId = IdUtils.getAppId(route);
    this.serviceId = IdUtils.getServiceId(route);
    this.activationId = IdUtils.getServicePackageActivationId(route);
    this.codePackageName = IdUtils.getCodePackageName(route);
  }
}