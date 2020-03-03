import { Component, Injector } from '@angular/core';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, forkJoin, of } from 'rxjs';
import { PartitionBaseController } from '../PartitionBase';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { mergeMap, map } from 'rxjs/operators';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends PartitionBaseController {
  unhealthyEvaluationsListSettings: ListSettings;
  listSettings: ListSettings;

  //replicator status
  primaryReplica: ReplicaOnPartition;
  queueSize: string; 

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) { 
    super(data, injector);
  }

  setup() {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    if (!this.listSettings) {
        let defaultSortProperties = ["replicaRoleSortPriority", "raw.NodeName"];
        let columnSettings = [
            new ListColumnSettingForLink("id", "Id", item => item.viewPath),
            new ListColumnSetting("raw.NodeName", "Node Name"),
            new ListColumnSettingWithFilter("role", "Replica Role", defaultSortProperties),
            new ListColumnSettingForBadge("healthState", "Health State"),
            new ListColumnSettingWithFilter("raw.ReplicaStatus", "Status")
        ];

        if (this.partition.isStatelessService) {
            columnSettings.splice(2, 1); // Remove replica role column
            defaultSortProperties = ["raw.NodeName"];
        }

        // Keep the sort properties in sync with the sortBy for ClusterTreeService.getDeployedReplicas
        this.listSettings = this.settings.getNewOrExistingListSettings("replicas", defaultSortProperties, columnSettings);
    }

    return forkJoin([
      this.partition.health.refresh(messageHandler),
      this.partition.replicas.refresh(messageHandler).pipe(mergeMap( () => {
          if(this.partition.isStatefulService) {
            let primary: ReplicaOnPartition = null;
            this.partition.replicas.collection.forEach(replica => {
              if(replica.raw.ReplicaRole === "Primary") {
                primary = replica;
                this.primaryReplica = primary;
              }
            })

            if(primary) {
              return primary.detail.refresh(messageHandler).pipe(map( ()=> {
                console.log(this.primaryReplica.detail.raw)
                this.queueSize = Utils.getFriendlyFileSize(+this.primaryReplica.detail.raw.ReplicatorStatus.ReplicationQueueStatus.QueueMemorySize)
                // console.log(primary.detail.replicatorStatus)
                // let replicaData = {
                //   xAxisCategories: [],
                //   dataSet: []
                // }

                // replicaData.xAxisCategories.push("Primary")
                // replicaData.dataSet.push(+primary.detail.replicatorStatus.raw.ReplicationQueueStatus.LastSequenceNumber)

                // primary.detail.replicatorStatus.raw.RemoteReplicators.forEach(replicator => {
                //   replicaData.xAxisCategories.push(replicator.ReplicaId)
                //   replicaData.dataSet.push(+replicator.LastAppliedReplicationSequenceNumber)
                // })

                // this.replicaData = replicaData;
                // console.log(this.replicaData)
              }))
            }
          }else{
            return of(null);
          }
      }))
    ]);
  }
}
