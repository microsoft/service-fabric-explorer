import { Component, OnInit, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { ServiceBaseController } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ServiceBaseController {

  tabs: ITab[] = [{
    name: "essentials",
    route: "./"
    },
    {
      name: "details",
      route: "./details"
    },
    {
      name: "manifest",
      route: "./manifest"
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
    if (this.appTypeName === Constants.SystemAppTypeName) {
      // remove manifest tab for system app service
      delete (this.tabs["manifest"]);

      this.tree.selectTreeNode([
          IdGenerator.cluster(),
          IdGenerator.systemAppGroup(),
          IdGenerator.service(this.serviceId)
      ]);
    } else {
      this.tree.selectTreeNode([
          IdGenerator.cluster(),
          IdGenerator.appGroup(),
          IdGenerator.appType(this.appTypeName),
          IdGenerator.app(this.appId),
          IdGenerator.service(this.serviceId)
      ]);
    }
  }
}