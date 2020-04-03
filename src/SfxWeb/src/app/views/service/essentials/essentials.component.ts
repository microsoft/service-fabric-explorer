import { Component, OnInit, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { ServiceBaseController } from '../ServiceBase';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ServiceBaseController {

  listSettings: ListSettings;

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) { 
    super(data, injector);
  }

  setup() {
    this.listSettings = this.settings.getNewOrExistingListSettings("partitions", ["id"], [
      new ListColumnSettingForLink("id", "Id", item => item.viewPath),
      new ListColumnSettingWithFilter("partitionInformation.raw.ServicePartitionKind", "Partition Kind"),
      new ListColumnSettingForBadge("healthState", "Health State"),
      new ListColumnSettingWithFilter("raw.PartitionStatus", "Status"),
    ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    this.service.description.refresh(messageHandler).subscribe();

    return forkJoin([
      this.service.health.refresh(messageHandler),
      this.service.partitions.refresh(messageHandler)
    ]);
  }

}
