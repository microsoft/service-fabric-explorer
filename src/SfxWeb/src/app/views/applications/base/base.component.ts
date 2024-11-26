import { Component, ElementRef, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';
import { ApplicationsBaseControllerDirective } from '../applicationsBase';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ApplicationsBaseControllerDirective implements IBaseView {
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
      name: 'app types',
      route: './apptypes'
    },
    {
      name: 'commands',
      route: './commands'
    }
  ];
  constructor(private tree: TreeService, private dataService: DataService, injector: Injector, public el: ElementRef) {
    super(dataService, injector);
  }

  setup() {

    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.dataService.clusterManifest.isEventStoreEnabled) {
        this.tabs = this.tabs.concat(Constants.EventsTab);
      }
    });

    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.appGroup()
    ], true);
  }
}

