import { Component, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { PartitionBaseController } from '../PartitionBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends PartitionBaseController {

  tabs: ITab[] = [{
    name: "essentials",
    route: "./"
    },
    {
      name: "details",
      route: "./details"
    },
    {
      name: "backups",
      route: "./backups"
    },
    {
      name: "events",
      route: "./events"
    }
  ];

  constructor(protected data: DataService, injector: Injector, private tree: TreeService) { 
    super(data, injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.appGroup(),
      IdGenerator.appType(this.appTypeName),
      IdGenerator.app(this.appId),
      IdGenerator.service(this.serviceId),
      IdGenerator.partition(this.partitionId),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (this.partition.isStatelessService || this.partition.parent.parent.raw.TypeName === "System") {
      this.tabs = this.tabs.filter(tab => tab.name !== "backups")
    };

    return of(null);
  }
}
