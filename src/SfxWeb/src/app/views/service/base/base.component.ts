import { Component, OnInit, Injector, ElementRef } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { DataService } from 'src/app/services/data.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { Constants } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBaseView } from '../../BaseView';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends ServiceBaseControllerDirective implements IBaseView {

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
    },
    {
      name: 'resources',
      route: './resources'
    }
  ];
  constructor(protected dataService: DataService, injector: Injector, private tree: TreeService, public el: ElementRef) {
    super(dataService, injector);
  }

  setup() {
    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.data.clusterManifest.isEventStoreEnabled &&
        this.tabs.indexOf(Constants.EventsTab) === -1) {
          this.tabs = this.tabs.concat(Constants.EventsTab);
        }
    });

    if (this.appTypeName === Constants.SystemAppTypeName) {
      this.tree.selectTreeNode([
          IdGenerator.cluster(),
          IdGenerator.systemAppGroup(),
          IdGenerator.service(this.serviceId)
      ], true);
    } else {
      // TODO consider route guard here?
      if (!this.tabs.some(tab => tab.name === 'manifest')){
        this.tabs.splice(2, 0, {
          name: 'manifest',
          route: './manifest'
        });
      }

      this.tree.selectTreeNode([
          IdGenerator.cluster(),
          IdGenerator.appGroup(),
          IdGenerator.appType(this.appTypeName),
          IdGenerator.app(this.appId),
          IdGenerator.service(this.serviceId)
      ], true);
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.clusterManifest.ensureInitialized().pipe(map(() => {
      this.tabs = this.tabs.filter(tab => tab.name !== 'backup');
      if (this.data.clusterManifest.isBackupRestoreEnabled && this.service.isStatefulService
          && this.appTypeName !== Constants.SystemAppTypeName) {
          this.tabs.push({
            name: 'backup',
            route: './backup'
          });
      }
    }));
  }
}
