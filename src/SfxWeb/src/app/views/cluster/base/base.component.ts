import { Component, OnInit } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';

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
  constructor(public tree: TreeService, public dataService: DataService) { }

  ngOnInit() {
    this.tree.selectTreeNode([
      IdGenerator.cluster()
    ], true);

    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if(this.dataService.clusterManifest.isBackupRestoreEnabled) {
        this.tabs.push({
          name: "backups",
          route: "/backups"
        })
      }
    })

    this.SFXClusterName = window.location.host; //TODO FIX THIS
  }

}
