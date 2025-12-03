import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IRawApplicationHealth, IRawNode, IRawReplicaOnPartition } from 'src/app/Models/RawDataTypes';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

enum NodeStatus {
  Up = 'Up',
  Down = 'Down',
  Disabled = 'Disabled',
  Disabling = 'Disabling'
}

const SYSTEM_APP_NAME = 'System';
const FAILOVER_MANAGER_SERVICE = 'System/FailoverManagerService';
const FAILOVER_MANAGER_PARTITION_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'app-recovery-progress',
  templateUrl: './recovery-progress.component.html',
  styleUrls: ['./recovery-progress.component.scss']
})
export class RecoveryProgressComponent implements OnInit {
  recoverySteps: RecoveryStep[] = [
    { name: RecoveryStepName.SeedNodesQuorum, status: 'pending' },
    { name: RecoveryStepName.FailoverManager, status: 'pending' },
    { name: RecoveryStepName.SystemServices, status: 'pending' },
    { name: RecoveryStepName.Nodes, status: 'pending' },
    { name: RecoveryStepName.UserServices, status: 'pending' }
  ];

  public isLoading = true;

  constructor(private restClient: RestClientService) {}

  ngOnInit(): void {
    this.checkRecoveryStatus();
  }

  checkRecoveryStatus(): void {
    this.isLoading = true;

    forkJoin({
      fmmNodes: this.restClient.getFMMNodes(),
      failoverManagerReplicas: this.restClient.getReplicasOnPartition(
        SYSTEM_APP_NAME,
        FAILOVER_MANAGER_SERVICE,
        FAILOVER_MANAGER_PARTITION_ID
      ),
      systemAppHealth: this.restClient.getApplicationHealth(SYSTEM_APP_NAME).pipe(
        catchError(() => {
          this.updateStepStatus(RecoveryStepName.SystemServices, 'error', 'Get system services health timed out. Please check if Cluster Manager is unhealthy.');
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        this.checkSeedNodeQuorum(results.fmmNodes);
        const fmHasQuorum = this.checkFailoverManagerStatus(results.failoverManagerReplicas);
        
        if (results.systemAppHealth) {
          this.checkSystemServicesStatus(results.systemAppHealth, fmHasQuorum);
        }
        
        this.checkNodesStatus(results.fmmNodes);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private updateStepStatus(stepName: RecoveryStepName, status: RecoveryStep['status'], tooltip: string): void {
    const step = this.findStep(stepName);
    if (step) {
      step.status = status;
      step.tooltip = tooltip;
    }
  }

  private findStep(stepName: RecoveryStepName): RecoveryStep | undefined {
    return this.recoverySteps.find(step => step.name === stepName);
  }

  private checkSeedNodeQuorum(rawNodes: IRawNode[]): void {
    const seedNodes = rawNodes.filter(node => node.IsSeedNode);
    const totalSeedNodes = seedNodes.length;
    const upSeedNodes = seedNodes.filter(node => node.NodeStatus === NodeStatus.Up).length;
    const quorum = this.calculateQuorum(totalSeedNodes);
    const hasQuorum = upSeedNodes >= quorum;

    const status = hasQuorum ? 'success' : 'error';
    const tooltip = hasQuorum 
      ? `Quorum achieved: ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`
      : `Quorum lost: Only ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`;

    this.updateStepStatus(RecoveryStepName.SeedNodesQuorum, status, tooltip);
  }

  private calculateQuorum(total: number): number {
    return Math.floor(total / 2) + 1;
  }

  private calculateWriteQuorum(replicas: IRawReplicaOnPartition[]): number {
    // If previous configuration (PC) role for all replicas are none, then the partition is not in reconfiguration.
    const isNotInReconfiguration = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None'
    );

    // If partition is not in reconfiguration, write quorum is calculated using current configuration (CC) role. 
    // Otherwise, it is calculated using PC role.
    const activeReplicas = isNotInReconfiguration
      ? replicas.filter(replica => this.isActiveReplica(replica.ReplicaRole))
      : replicas.filter(replica => this.isActiveReplica(replica.PreviousReplicaRole));

    return this.calculateQuorum(activeReplicas.length);
  }

  private isActiveReplica(role: string | undefined): boolean {
    return role === 'ActiveSecondary' || role === 'Primary';
  }

  private checkFailoverManagerStatus(replicas: IRawReplicaOnPartition[]): boolean {
    const readyReplicas = replicas.filter(replica => replica.ReplicaStatus === 'Ready').length;
    const writeQuorum = this.calculateWriteQuorum(replicas);
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
      : isOk 
        ? 'System application health is Ok'
        : `System application health is ${healthState}`;

    this.updateStepStatus(RecoveryStepName.SystemServices, status, tooltip);
  }

  private checkNodesStatus(rawNodes: IRawNode[]): void {
    const totalNodes = rawNodes.length;
    const upNodes = rawNodes.filter(node => node.NodeStatus === NodeStatus.Up).length;
    const disabledNodes = rawNodes.filter(node => 
      node.NodeStatus === NodeStatus.Disabled || node.NodeStatus === NodeStatus.Disabling
    );
    const downNodes = rawNodes.filter(node => node.NodeStatus === NodeStatus.Down);
    const seedNodeCount = rawNodes.filter(node => node.IsSeedNode).length;
    const minRequiredNodes = seedNodeCount;
    const hasMinimumNodes = upNodes >= minRequiredNodes;

    let status: RecoveryStep['status'];
    let tooltip: string;

    if (downNodes.length > 0) {
      status = 'error';
      tooltip = `${downNodes.length} node(s) are Down`;
    } else if (disabledNodes.length > 0) {
      status = 'warning';
      tooltip = `${disabledNodes.length} node(s) are Disabled or Disabling`;
    } else {
      status = 'success';
      tooltip = `All ${totalNodes} nodes are Up`;
    }

    this.updateStepStatus(RecoveryStepName.Nodes, status, tooltip);
  }
}