// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { map } from 'rxjs/operators';
import { DashboardViewModel, IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';

@Component({
  selector: 'app-all-nodes',
  templateUrl: './all-nodes.component.html',
  styleUrls: ['./all-nodes.component.scss']
})
export class AllNodesComponent extends BaseControllerDirective {

  nodes: NodeCollection;
  listSettings: ListSettings;
  tiles: IDashboardViewModel[] = [];

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
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

      this.nodes.getNodeStateCounts(false, false).forEach(type => {
        this.tiles.push(
          DashboardViewModel.fromHealthStateCount(type.nodeType, type.nodeType, false, {
            ErrorCount: type.errorCount,
            WarningCount: type.warningCount,
            OkCount: type.okCount
          })
        );
      });
    }));
  }
}
