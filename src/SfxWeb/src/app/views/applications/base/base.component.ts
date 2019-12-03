import { Component, OnInit } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent {
  SFXClusterName: string = "";
  
  tabs: ITab[] = [{
    name: "all applications",
    route: "./"
    },
    {
      name: "upgrades in progress",
      route: "./upgrades"
    },
    {
      name: "events",
      route: "./events"
    }
  ];
  constructor(public tree: TreeService) { }
}
