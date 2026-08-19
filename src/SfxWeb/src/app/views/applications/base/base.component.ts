import { Component, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
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
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent extends ApplicationsBaseControllerDirective implements IBaseView {
  private tree = inject(TreeService);
  private dataService: DataService = inject(DataService);
  el = inject(ElementRef);

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

