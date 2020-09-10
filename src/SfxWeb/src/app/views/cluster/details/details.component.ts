import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterLoadInformation, ClusterHealth } from 'src/app/Models/DataModels/Cluster';
import { tap, map } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { INodesStatusDetails } from 'src/app/Models/RawDataTypes';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends BaseController {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  clusterLoadInformation: ClusterLoadInformation;
  clusterHealth: ClusterHealth;
  nodes: NodeCollection;
  nodesStatuses: INodesStatusDetails[];

  nodeStatusListSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;
  healthEventsListSettings: ListSettings;

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
   }

  setup(){
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    this.nodes = this.data.nodes;

    this.nodeStatusListSettings = this.settings.getNewOrExistingNodeStatusListSetting();
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('clusterUpgradeProgressUnhealthyEvaluations');
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.clusterUpgradeProgress.refresh(messageHandler),
      this.clusterLoadInformation.refresh(messageHandler),
      this.nodes.refresh(messageHandler).pipe(map( () => {
        this.nodesStatuses = this.nodes.getNodeStateCounts();
      }))
    ]);
  }
}
