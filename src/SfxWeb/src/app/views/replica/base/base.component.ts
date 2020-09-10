import { Component, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ReplicaBaseController } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ReplicaBaseController {

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    },
    {
      name: 'events',
      route: './events'
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) {
    super(data, injector);
  }

  setup() {
    this.isSystem = this.appTypeName === Constants.SystemAppTypeName;
    if (this.isSystem) {
        this.tree.selectTreeNode([
            IdGenerator.cluster(),
            IdGenerator.systemAppGroup(),
            IdGenerator.service(this.serviceId),
            IdGenerator.partition(this.partitionId),
            IdGenerator.replica(this.replicaId)
        ]);
    } else {
        this.tree.selectTreeNode([
            IdGenerator.cluster(),
            IdGenerator.appGroup(),
            IdGenerator.appType(this.appTypeName),
            IdGenerator.app(this.appId),
            IdGenerator.service(this.serviceId),
            IdGenerator.partition(this.partitionId),
            IdGenerator.replica(this.replicaId)
        ]);
    }
  }
}
