import { Component, Injector } from '@angular/core';
import { DeployedReplicaBaseController } from '../DeployedReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { of, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends DeployedReplicaBaseController {

  type = '';

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
    console.log(this);
    this.tree.selectTreeNode([
        IdGenerator.cluster(),
        IdGenerator.nodeGroup(),
        IdGenerator.node(this.nodeName),
        IdGenerator.deployedApp(this.applicationId),
        IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
        IdGenerator.deployedReplicaGroup(),
        IdGenerator.deployedReplica(this.partitionId)
    ], true);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.type = this.replica.isStatelessService ? 'Deployed Instance' : 'Deployed Replica';

    return of(null);
  }

}
