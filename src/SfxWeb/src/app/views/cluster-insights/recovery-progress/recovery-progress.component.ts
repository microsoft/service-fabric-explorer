import { Component, Injector } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { RestClientService } from 'src/app/services/rest-client.service';
import { DataService } from 'src/app/services/data.service';
import { IRawApplicationHealth, IRawReplicaOnPartition } from 'src/app/Models/RawDataTypes';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { NodeStatusConstants, Constants } from 'src/app/Common/Constants';
import { calculateWriteQuorum } from 'src/app/Utils/PartitionQuorumUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

interface RecoveryStep {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  tooltip?: string;
}

enum RecoveryStepName {
  SeedNodesQuorum = 'Seed Nodes Quorum',
  FailoverManager = 'Failover Manager',
  SystemServices = 'System Services',
  Nodes = 'Nodes',
  UserServices = 'User Services'
}

@Component({
  selector: 'app-recovery-progress',
  templateUrl: './recovery-progress.component.html',
  styleUrls: ['./recovery-progress.component.scss']
})
export class RecoveryProgressComponent extends BaseControllerDirective {
  recoverySteps: RecoveryStep[] = [
    { name: RecoveryStepName.SeedNodesQuorum, status: 'pending' },
    { name: RecoveryStepName.FailoverManager, status: 'pending' },
    { name: RecoveryStepName.SystemServices, status: 'pending' },
    { name: RecoveryStepName.Nodes, status: 'pending' },
    { name: RecoveryStepName.UserServices, status: 'pending' }
  ];

  isLoading = true;
  override fixedRefreshIntervalMs = 65000; // 65 seconds

  constructor(private restClient: RestClientService, private dataService: DataService, injector: Injector) {
    super(injector);
  }

  refresh(): Observable<any> {
    this.isLoading = true;
    return forkJoin({
      nodes: this.dataService.getNodes(true),
      failoverManagerReplicas: this.restClient.getReplicasOnPartition(
        Constants.SystemAppId,
        `${Constants.SystemAppId}/${Constants.FailoverManagerServiceName}`,
        Constants.FailoverManagerPartitionId
      ),
      systemAppHealth: this.restClient.getApplicationHealth('System').pipe(
        catchError(() => {
          this.updateStepStatus(RecoveryStepName.SystemServices, 'error', 'Get system services health timed out. Please check if Cluster Manager is unhealthy.');
          return of(null);
        })
      ),
      apps: this.dataService.getApps(true).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      map(results => {
        this.checkSeedNodeQuorum(results.nodes);
        const fmHasQuorum = this.checkFailoverManagerStatus(results.failoverManagerReplicas);

        if (results.systemAppHealth) {
          this.checkSystemServicesStatus(results.systemAppHealth, fmHasQuorum);
        }

        this.checkNodesStatus(results.nodes);
        this.checkUserApplicationHealth(results.apps);
        this.isLoading = false;
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    );
  }

  private updateStepStatus(stepName: RecoveryStepName, status: RecoveryStep['status'], tooltip: string): void {
    const step = this.recoverySteps.find(s => s.name === stepName);
    if (step) {
      step.status = status;
      step.tooltip = tooltip;
    }
  }

  private checkSeedNodeQuorum(nodeCollection: NodeCollection): void {
    const totalSeedNodes = nodeCollection.seedNodeCount;
    const upSeedNodes = nodeCollection.collection.filter(node => node.raw.IsSeedNode && node.raw.NodeStatus === NodeStatusConstants.Up).length;
    const seedNodeQuorum = Math.floor(totalSeedNodes / 2) + 1;
    const hasQuorum = upSeedNodes >= seedNodeQuorum;

    const status = hasQuorum ? 'success' : 'error';
    const tooltip = hasQuorum 
      ? `Quorum achieved: ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${seedNodeQuorum} required)`
      : `Quorum lost: Only ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${seedNodeQuorum} required)`;

    this.updateStepStatus(RecoveryStepName.SeedNodesQuorum, status, tooltip);
  }

  private checkFailoverManagerStatus(replicas: IRawReplicaOnPartition[]): boolean {
    const readyReplicas = replicas.filter(replica => replica.ReplicaStatus === 'Ready').length;
    const writeQuorum = calculateWriteQuorum(replicas);
    const hasQuorum = readyReplicas >= writeQuorum;

    const status = hasQuorum ? 'success' : 'error';
    const tooltip = hasQuorum 
      ? `Write quorum achieved: ${readyReplicas} replicas are Ready (${writeQuorum} required)`
      : `Write quorum lost: Only ${readyReplicas} replicas are Ready (${writeQuorum} required)`;

    this.updateStepStatus(RecoveryStepName.FailoverManager, status, tooltip);

    return hasQuorum;
  }

  private checkSystemServicesStatus(applicationHealth: IRawApplicationHealth, fmHasQuorum: boolean): void {
    const healthState = applicationHealth.AggregatedHealthState;
    const isOk = healthState === 'Ok' && fmHasQuorum;

    const status = isOk ? 'success' : 'error';
    const tooltip = !fmHasQuorum
      ? 'Failover Manager is in quorum loss'
      : `System application health is in ${healthState} state`;

    this.updateStepStatus(RecoveryStepName.SystemServices, status, tooltip);
  }

  private checkNodesStatus(nodeCollection: NodeCollection): void {
    const totalNodes = nodeCollection.collection.length;
    const downNodes = nodeCollection.collection.filter(node => node.raw.NodeStatus === NodeStatusConstants.Down);

    let status: RecoveryStep['status'];
    let tooltip: string;

    if (downNodes.length > 0) {
      status = 'error';
      tooltip = `${downNodes.length} node(s) are Down`;
    } else if (nodeCollection.disabledAndDisablingCount > 0) {
      status = 'warning';
      tooltip = `${nodeCollection.disabledAndDisablingCount} node(s) are Disabled or Disabling`;
    } else {
      status = 'success';
      tooltip = `All ${totalNodes} nodes are Up`;
    }

    this.updateStepStatus(RecoveryStepName.Nodes, status, tooltip);
  }

  private checkUserApplicationHealth(appsCollection: any): void {
    if (!appsCollection || !appsCollection.collection) {
      this.updateStepStatus(RecoveryStepName.UserServices, 'warning', 'Unable to determine user services status');
      return;
    }

    const apps = appsCollection.collection;
    const totalApps = apps.length;

    if (totalApps === 0) {
      this.updateStepStatus(RecoveryStepName.UserServices, 'success', 'No user applications deployed');
      return;
    }

    const warningApps = apps.filter((app: any) => app.healthState.text === 'Warning').length;
    const errorApps = apps.filter((app: any) => app.healthState.text === 'Error').length;

    let status: RecoveryStep['status'];
    let tooltip: string;

    if (errorApps > 0) {
      status = 'error';
      tooltip = `${errorApps} application(s) have errors`;
    } else if (warningApps > 0) {
      status = 'warning';
      tooltip = `${warningApps} application(s) have warnings`;
    } else {
      status = 'success';
      tooltip = `All ${totalApps} application(s) are healthy`;
    }

    this.updateStepStatus(RecoveryStepName.UserServices, status, tooltip);
  }
}