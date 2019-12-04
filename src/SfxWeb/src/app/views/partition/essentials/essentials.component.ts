import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {
  public appId: string;
  public serviceId: string;
  public partitionId: string;
  public appTypeName: string;

  partition: Partition;
  unhealthyEvaluationsListSettings: ListSettings;
  listSettings: ListSettings;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getPartition(this.appId, this.serviceId, this.partitionId, true, messageHandler)
    .pipe(map(partition => {
        this.partition = partition;
        // this.data.backupPolicies.refresh(messageHandler);
        if (this.partition.isStatefulService) {
            this.partition.partitionBackupInfo.partitionBackupConfigurationInfo.refresh(messageHandler);
        }

        if (!this.listSettings) {
            let defaultSortProperties = ["replicaRoleSortPriority", "raw.NodeName"];
            let columnSettings = [
                new ListColumnSettingForLink("id", "Id", item => item.viewPath),
                new ListColumnSetting("raw.NodeName", "Node Name"),
                new ListColumnSettingWithFilter("role", "Replica Role", defaultSortProperties),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.ReplicaStatus", "Status")
            ];

            if (partition.isStatelessService) {
                columnSettings.splice(2, 1); // Remove replica role column
                defaultSortProperties = ["raw.NodeName"];
            }

            // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
            this.listSettings = this.settings.getNewOrExistingListSettings("replicas", defaultSortProperties, columnSettings);
        }
        return forkJoin([
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
