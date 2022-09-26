import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterLoadInformation, ClusterHealth } from 'src/app/Models/DataModels/Cluster';
import { tap, map } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { INodesStatusDetails, NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends BaseControllerDirective {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  clusterLoadInformation: ClusterLoadInformation;
  clusterHealth: ClusterHealth;
  nodes: NodeCollection;
  nodesStatuses: INodesStatusDetails[];

  nodeStatusListSettings: ListSettings;
  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;

  constructor(private data: DataService, private settings: SettingsService, injector: Injector) {
    super(injector);
   }

  setup(){
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.clusterLoadInformation = this.data.clusterLoadInformation;
    this.clusterHealth = this.data.clusterHealth;
    this.nodes = this.data.nodes;

    this.nodeStatusListSettings = this.settings.getNewOrExistingNodeStatusListSetting();
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('clusterUpgradeProgressUnhealthyEvaluations');
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
