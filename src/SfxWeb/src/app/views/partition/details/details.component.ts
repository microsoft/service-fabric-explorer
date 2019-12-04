import { Component, OnInit, Injector } from '@angular/core';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { ListSettings } from 'src/app/Models/ListSettings';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends BaseController {
  public appId: string;
  public serviceId: string;
  public partitionId: string;
  public appTypeName: string;

  partition: Partition;
  healthEventsListSettings: ListSettings;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getPartition(this.appId, this.serviceId, this.partitionId, true, messageHandler)
    .pipe(map(partition => {
        this.partition = partition;
        // this.data.backupPolicies.refresh(messageHandler);
        if (this.partition.isStatefulService) {
            this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh(messageHandler);
        }

        this.partition.partitionBackupInfo.partitionBackupProgress.refresh(messageHandler);
        this.partition.partitionBackupInfo.partitionRestoreProgress.refresh(messageHandler);

        return forkJoin([
          this.partition.loadInformation.refresh(messageHandler),
          this.partition.health.refresh(messageHandler),
          this.partition.replicas.refresh(messageHandler),
          this.partition.isStatefulService ? this.partition.partitionBackupInfo.latestPartitionBackup.refresh(messageHandler) : of(null)
        ]);
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appId = IdUtils.getAppId(route);
    this.serviceId = IdUtils.getServiceId(route);
    this.partitionId = IdUtils.getPartitionId(route);
    this.appTypeName = IdUtils.getAppTypeName(route);
  }
}
