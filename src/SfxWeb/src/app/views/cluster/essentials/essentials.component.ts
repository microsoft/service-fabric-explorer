import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterHealth, ClusterManifest } from '../../../Models/DataModels/Cluster';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { Observable, forkJoin, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { map, catchError } from 'rxjs/operators';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { RoutesService } from 'src/app/services/routes.service';
import { HealthUtils, HealthStatisticsEntityKind } from 'src/app/Utils/healthUtils';
import { RepairTaskCollection } from 'src/app/Models/DataModels/collections/RepairTaskCollection';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';


@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseControllerDirective {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  nodes: NodeCollection;
  clusterHealth: ClusterHealth;
  systemApp: SystemApplication;
  unhealthyEvaluationsListSettings: ListSettings;
  clusterManifest: ClusterManifest;
  repairtaskCollection: RepairTaskCollection;

  nodesDashboard: IDashboardViewModel;
  appsDashboard: IDashboardViewModel;
  servicesDashboard: IDashboardViewModel;
  partitionsDashboard: IDashboardViewModel;
  replicasDashboard: IDashboardViewModel;
  upgradesDashboard: IDashboardViewModel;
  upgradeAppsCount = 0;

  essentialItems: IEssentialListItem[] = [];

  constructor(public data: DataService,
              public injector: Injector,
              public settings: SettingsService,
              private routes: RoutesService) {
    super(injector);
  }

  setup() {
    this.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.nodes = this.data.nodes;
    this.systemApp = this.data.systemApp;
    this.repairtaskCollection = this.data.repairCollection;
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.clusterHealth.refresh(messageHandler).pipe(map((clusterHealth: ClusterHealth) => {
        const nodesHealthStateCount = HealthUtils.getHealthStateCount(clusterHealth.raw, HealthStatisticsEntityKind.Node);
        this.nodesDashboard = DashboardViewModel.fromHealthStateCount('Nodes', 'Node', true, nodesHealthStateCount, this.data.routes, RoutesService.getNodesViewPath());

        const appsHealthStateCount = HealthUtils.getHealthStateCount(clusterHealth.raw, HealthStatisticsEntityKind.Application);
        this.appsDashboard = DashboardViewModel.fromHealthStateCount('Applications', 'Application', true, appsHealthStateCount, this.data.routes, RoutesService.getAppsViewPath());

        const servicesHealthStateCount = HealthUtils.getHealthStateCount(clusterHealth.raw, HealthStatisticsEntityKind.Service);
        this.servicesDashboard = DashboardViewModel.fromHealthStateCount('Services', 'Service', false, servicesHealthStateCount);

        const partitionsDashboard = HealthUtils.getHealthStateCount(clusterHealth.raw, HealthStatisticsEntityKind.Partition);
        this.partitionsDashboard = DashboardViewModel.fromHealthStateCount('Partitions', 'Partition', false, partitionsDashboard);

        const replicasHealthStateCount = HealthUtils.getHealthStateCount(clusterHealth.raw, HealthStatisticsEntityKind.Replica);
        this.replicasDashboard = DashboardViewModel.fromHealthStateCount('Replicas', 'Replica', false, replicasHealthStateCount);
        clusterHealth.checkExpiredCertStatus();
    })),
      this.data.getApps(true, messageHandler)
                .pipe(map(apps => {
                    this.upgradeAppsCount = apps.collection.filter(app => app.isUpgrading).length;
                })),
      this.nodes.refresh(messageHandler).pipe(map(() => {this.updateItemInEssentials(); })),
      this.systemApp.refresh(messageHandler).pipe(catchError(err => of(null))),
      this.clusterUpgradeProgress.refresh(messageHandler),
      this.data.getClusterManifest().pipe(map((manifest) => {
        if (manifest.isRepairManagerEnabled) {
          return this.repairtaskCollection.refresh(messageHandler);
        }else{
          return of(null);
        }
      }))
    ]).pipe(map(() => {
      this.updateItemInEssentials();
    }));
  }


  updateItemInEssentials() {
    this.essentialItems = [
      {
        descriptionName: 'Code Version',
        copyTextValue: this.clusterUpgradeProgress?.raw?.CodeVersion,
        displayText: this.clusterUpgradeProgress?.raw?.CodeVersion,
      },
      {
        descriptionName: 'Fault Domains',
        displayText: this.nodes.faultDomains.length.toString(),
        copyTextValue: this.nodes.faultDomains.length.toString()
      },
      {
        descriptionName: 'Upgrade Domains',
        displayText: this.nodes.upgradeDomains.length.toString(),
        copyTextValue: this.nodes.upgradeDomains.length.toString()
      },
      {
        descriptionName: 'Healthy Seed Nodes',
        displayText: this.nodes.healthySeedNodes,
        copyTextValue: this.nodes.healthySeedNodes
      }
    ];
  }
}
