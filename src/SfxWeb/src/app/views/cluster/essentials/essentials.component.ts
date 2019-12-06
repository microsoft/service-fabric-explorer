import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterHealth } from '../../../Models/DataModels/Cluster';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { Observable, forkJoin } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';


@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  nodes: NodeCollection;
  clusterHealth: ClusterHealth;
  systemApp: SystemApplication;
  unhealthyEvaluationsListSettings: ListSettings;

  constructor(public data: DataService, injector: Injector, public settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.nodes = this.data.nodes;
    this.systemApp = this.data.systemApp;
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
    console.log(this.clusterHealth)
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.clusterHealth.refresh(messageHandler),
      this.nodes.refresh(messageHandler),
      this.systemApp.refresh(messageHandler),
      this.clusterUpgradeProgress.refresh(messageHandler)
    ]);
  }

}
