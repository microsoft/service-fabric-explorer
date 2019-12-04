import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Service } from 'src/app/Models/DataModels/Service';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {
  appId: string;
  serviceId: string;

  service: Service;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;


  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings("partitions", ["id"], [
      new ListColumnSettingForLink("id", "Id", item => item.viewPath),
      new ListColumnSettingWithFilter("partitionInformation.raw.ServicePartitionKind", "Partition Kind"),
      new ListColumnSettingForBadge("healthState", "Health State"),
      new ListColumnSettingWithFilter("raw.PartitionStatus", "Status"),
    ]);

    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getService(this.appId, this.serviceId, true, messageHandler).pipe(mergeMap(service => {
      this.service = service;
      console.log(service);
      return forkJoin([
        this.service.health.refresh(messageHandler),
        this.service.description.refresh(messageHandler),
        this.service.partitions.refresh(messageHandler)
      ]);
    }))
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appId = IdUtils.getAppId(route);
    this.serviceId = IdUtils.getServiceId(route);
  }
}
