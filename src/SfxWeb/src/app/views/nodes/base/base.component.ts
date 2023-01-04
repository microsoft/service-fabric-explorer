import { Component, OnInit } from '@angular/core';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { TreeService } from 'src/app/services/tree.service';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  tabs: ITab[] = [{
    name: 'all nodes',
    route: './'
  },
    {
      name: 'commands',
     route: './commands' 
    }
  ];
  constructor(public tree: TreeService, private data: DataService) { }

  ngOnInit() {
    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
        this.tabs = this.tabs.concat((Constants.EventsTab));
      }
    });

    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup()
    ], true);
  }
}
