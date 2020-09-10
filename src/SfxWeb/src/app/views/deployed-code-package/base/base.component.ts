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

  containerLogTabName = 'container logs';

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeName),
      IdGenerator.deployedApp(this.appId),
      IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
      IdGenerator.deployedCodePackageGroup(),
      IdGenerator.deployedCodePackage(this.codePackageName)
    ], true);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    // make sure tab exists for containers otherwise make sure it doesnt display.
    if (this.deployedCodePackage.raw.HostType === Constants.ContainerHostTypeName) {
      // only add tab if it hasnt been added yet
      if (!this.tabs.some(tab => tab.name === this.containerLogTabName)) {
        this.tabs.push(    {
          name: this.containerLogTabName,
          route: './containerlogs'
        });
      }
    }else{
      this.tabs = this.tabs.filter(tab => tab.name !== this.containerLogTabName);
    }

    return of(null);
  }
}
