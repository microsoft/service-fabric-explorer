import { Component, OnInit, Injector } from '@angular/core';
import { DeployedCodePackageBaseController } from '../DeployedCodePackageBase';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends DeployedCodePackageBaseController {

  tabs: ITab[] = [{
    name: "essentials",
    route: "./"
    },
    {
      name: "details",
      route: "./details"
    },
    {
      name: "containerlogs",
      route: "./containerlogs"
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) { 
    super(data, injector);
  }

  setup() {
    console.log(this)
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeName),
      IdGenerator.deployedApp(this.appId),
      IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
      IdGenerator.deployedCodePackageGroup(),
      IdGenerator.deployedCodePackage(this.codePackageName)
    ]);


  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (this.deployedCodePackage.raw.HostType !== Constants.ContainerHostTypeName) {
      // Remove containerLogs tab for non Container HostTypes
      this.tabs = this.tabs.filter(tab => tab.name !== "containerlogs");
    }

    return of(null);
  }
}
