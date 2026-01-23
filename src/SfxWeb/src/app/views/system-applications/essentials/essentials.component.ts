// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, OnInit, Injector } from '@angular/core';
import { ServiceApplicationsBaseControllerDirective } from '../SystemApplicationBase';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ServiceApplicationsBaseControllerDirective {

  listSettings: ListSettings;
  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings('systemServices', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.TypeName', 'Service Type'),
      new ListColumnSetting('raw.ManifestVersion', 'Version'),
      new ListColumnSettingWithFilter('raw.ServiceKind', 'Service Kind'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.ServiceStatus', 'Status')
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([this.systemApp.services.refresh(messageHandler),
    this.data.getNodes(true)
    ]).pipe(map((results) => {
      let lowest = results[1].collection[0];

      results[1].collection.forEach(node => {
        if (parseInt(lowest.id, 16) > parseInt(node.id, 16) && node.raw.HealthState === NodeStatusConstants.Up) {
          lowest = node;
        }
      })

      if(lowest) {
        this.essentialItems = [
          {
            descriptionName: 'Likely FMM Node',
            displayText: lowest.name,
            copyTextValue: lowest.name,
          }
        ];
      }
    }))
  }
}
