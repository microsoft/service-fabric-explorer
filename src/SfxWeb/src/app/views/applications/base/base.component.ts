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
  SFXClusterName = '';

  tabs: ITab[] = [{
    name: 'all applications',
    route: './'
    },
    {
      name: 'upgrades in progress',
      route: './upgrades'
    },
    {
      name: 'events',
      route: './events'
    }
  ];
  constructor(private tree: TreeService) {
  }

  ngOnInit() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.appGroup()
    ], true);
  }
}

