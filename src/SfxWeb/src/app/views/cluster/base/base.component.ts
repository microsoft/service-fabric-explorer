import { Component, OnInit } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  SFXClusterName: string = "";
  
  tabs: ITab[] = [{
    name: "essentials",
    route: ""
    },
    {
      name: "details",
      route: "/details"
    },
    {
      name: "metrics",
      route: "/metrics"
    },
    {
      name: "cluster map",
      route: "/clustermap"
    },
    {
      name: "image store",
      route: "/imagestore"
    },
    {
      name: "manifest",
      route: "/manifest"
    },
    {
      name: "events",
      route: "/events"
    }
  ];
  constructor(public tree: TreeService) { }

  ngOnInit() {
    this.tree.selectTreeNode([
      IdGenerator.cluster()
    ], true);

    this.SFXClusterName = window.location.host; //TODO FIX THIS
  }

}
