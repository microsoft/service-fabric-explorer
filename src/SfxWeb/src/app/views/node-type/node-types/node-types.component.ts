import { Component, Injector, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { NodeTypeBaseControllerDirective } from '../NodeTypeBase';

@Component({
  selector: 'app-node-types',
  templateUrl: './node-types.component.html',
  styleUrls: ['./node-types.component.scss']
})
export class NodeTypesComponent extends NodeTypeBaseControllerDirective {

  nodes: NodeCollection;
  nodeTypeListSettings: ListSettings;
  tiles: IDashboardViewModel[] = [];
  nodeTypeCollection: any[];

  constructor(protected data: DataService, private settings: SettingsService, injector: Injector) {
    super(data, injector);
   }

  setup() {
    this.nodes = this.data.nodes;
    this.nodeTypeListSettings = this.settings.getNewOrExistingNodeTypeListSettings('nodes');
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.nodes.refresh(messageHandler).pipe(map(() => {
      this.tiles = [];
      this.nodeTypeCollection = [];

      this.nodes.collection.map(item => {
        if(this.nodeType == item.raw.Type) {
          this.nodeTypeCollection.push(item);
        }
      });

      this.nodes.getNodeStateCounts(false, false).forEach(type => {
        if(this.nodeType == type.nodeType) {
          this.tiles.push(
            DashboardViewModel.fromHealthStateCount(type.nodeType, type.nodeType, false, {
              ErrorCount: type.errorCount,
              WarningCount: type.warningCount,
              OkCount: type.okCount
            })
          );
        }
      });
    }));
  }

}
