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
  listSettings: ListSettings;
  tiles: IDashboardViewModel[] = [];
  typeCollection: any[];

  constructor(protected data: DataService, private settings: SettingsService, injector: Injector) {
    super(data, injector);
   }

  setup() {
    this.nodes = this.data.nodes;
    this.listSettings = this.settings.getNewOrExistingListSettings('nodes', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.Type', 'Node Type'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('nodeStatus', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version'),
  ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.nodes.refresh(messageHandler).pipe(map(() => {
      this.tiles = [];
      this.typeCollection = [];

      this.nodes.collection.map(item => {
        if(this.nodeType == item.raw.Type) {
          this.typeCollection.push(item);
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
