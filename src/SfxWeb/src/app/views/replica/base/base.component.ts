import { Component, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent extends ReplicaBaseControllerDirective implements IBaseView {
  protected dataService: DataService = inject(DataService);
  private tree = inject(TreeService);
  el = inject(ElementRef);


  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    },
    {
      name: 'details',
      route: './details'
    },
    {
      name: 'commands',
      route: './commands'
    }
  ];

  setup() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
          this.tabs = this.tabs.concat(Constants.EventsTab);
        }
    });

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
