import { Component, Injector } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { PartitionBaseControllerDirective } from '../PartitionBase';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { Constants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends PartitionBaseControllerDirective {

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

  constructor(protected dataService: DataService, injector: Injector, private tree: TreeService) {
    super(dataService, injector);
  }

  setup() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
          this.tabs = this.tabs.concat(Constants.EventsTab);
        }

      if (this.dataService.clusterManifest.isBackupRestoreEnabled &&
        !this.tabs.some(tab => tab.name === 'backups')) {
        this.tabs = this.tabs.concat({
          name: 'backups',
          route: './backups'
        });
      }
    });

    if (this.appTypeName === Constants.SystemAppTypeName) {
      this.tree.selectTreeNode([
          IdGenerator.cluster(),
          IdGenerator.systemAppGroup(),
          IdGenerator.service(this.serviceId),
          IdGenerator.partition(this.partitionId)
      ]);
    } else {
      this.tree.selectTreeNode([
        IdGenerator.cluster(),
        IdGenerator.appGroup(),
        IdGenerator.appType(this.appTypeName),
        IdGenerator.app(this.appId),
        IdGenerator.service(this.serviceId),
        IdGenerator.partition(this.partitionId),
      ], true);
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (this.partition.isStatelessService || this.partition.parent.parent.raw.TypeName === 'System') {
      this.tabs = this.tabs.filter(tab => tab.name !== 'backups');
    }

    this.data.clusterManifest.ensureInitialized().subscribe(() => {
      if (!this.data.clusterManifest.isBackupRestoreEnabled) {
        this.tabs = this.tabs.filter(tab => tab.name !== 'backups');
      }
    });

    return of(null);
  }
}
