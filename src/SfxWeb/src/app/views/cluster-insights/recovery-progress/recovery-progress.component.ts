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

@Component({
  selector: 'app-recovery-progress',
  templateUrl: './recovery-progress.component.html',
  styleUrls: ['./recovery-progress.component.scss']
})
export class RecoveryProgressComponent implements OnInit {
  recoverySteps: RecoveryStep[] = [
    { name: 'Seed Nodes Quorum', status: 'pending' },
    { name: 'Failover Manager', status: 'pending' },
    { name: 'System Services', status: 'pending' },
    { name: 'Nodes', status: 'pending' },
    { name: 'User Services', status: 'pending' }
  ];

  isLoading: boolean = true;

  constructor(private restClient: RestClientService) { }

  ngOnInit(): void {
    this.checkRecoveryStatus();
  }

  checkRecoveryStatus(): void {
    this.isLoading = true;
    // Check all recovery steps in parallel
    forkJoin({
      fmmNodes: this.restClient.getFMMNodes(),
      failoverManagerReplicas: this.restClient.getReplicasOnPartition('System', 'System/FailoverManagerService', '00000000-0000-0000-0000-000000000001'),
      systemAppHealth: this.restClient.getApplicationHealth('System').pipe(
        catchError((error) => {
          // Handle timeout or any error - mark System Services as error
          const systemServicesStep = this.recoverySteps.find(step => step.name === 'System Services');
          if (systemServicesStep) {
            systemServicesStep.status = 'error';
            systemServicesStep.tooltip = 'Get system services health timed out. Please check if Cluster Manager is unhealthy.';
          }
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        this.checkSeedNodeQuorum(results.fmmNodes);
        const fmHasQuorum = this.checkFailoverManagerStatus(results.failoverManagerReplicas);
        // Only check system services status if we have valid health data
        if (results.systemAppHealth) {
          this.checkSystemServicesStatus(results.systemAppHealth, fmHasQuorum);
        }
        this.checkNodesStatus(results.fmmNodes);
        this.isLoading = false;
      },
      error: (error) => {
        // Error loading recovery status
        this.isLoading = false;
      }
    });
  }

  checkSeedNodeQuorum(rawNodes: IRawNode[]): void {
    const totalSeedNodes = rawNodes.filter(node => node.IsSeedNode).length;
    const upSeedNodes = rawNodes.filter(node => node.IsSeedNode && node.NodeStatus === 'Up').length;
    const quorum = Math.floor(totalSeedNodes / 2) + 1;

    // Update Seed Nodes Quorum status
    const seedNodeStep = this.recoverySteps.find(step => step.name === 'Seed Nodes Quorum');
    if (seedNodeStep) {
      seedNodeStep.status = upSeedNodes >= quorum ? 'success' : 'error';
      seedNodeStep.tooltip = upSeedNodes >= quorum 
        ? `Quorum achieved: ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`
        : `Quorum lost: Only ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`;
    }
  }

  calculateWriteQuorum(replicas: IRawReplicaOnPartition[]): number {
    // Check if all previous replica roles are None
    const allPreviousNone = replicas.every(replica => 
      replica.PreviousReplicaRole === 'None' || !replica.PreviousReplicaRole
    );

    let n = 0;

    if (allPreviousNone) {
      // Use current replica role
      n = replicas.filter(replica => 
        replica.ReplicaRole === 'ActiveSecondary' || replica.ReplicaRole === 'Primary'
      ).length;
    } else {
      // Use previous replica role
      n = replicas.filter(replica => 
        replica.PreviousReplicaRole === 'ActiveSecondary' || replica.PreviousReplicaRole === 'Primary'
      ).length;
    }

    // Write Quorum = (n + 1) / 2
    return Math.floor(n / 2) + 1;
  }

  checkFailoverManagerStatus(replicas: IRawReplicaOnPartition[]): boolean {
    const readyReplicas = replicas.filter(replica => replica.ReplicaStatus === 'Ready').length;
    
    // Calculate write quorum using the accurate formula
    const writeQuorum = this.calculateWriteQuorum(replicas);
    const hasQuorum = readyReplicas >= writeQuorum;

    // Update Failover Manager status based on write quorum
    const failoverManagerStep = this.recoverySteps.find(step => step.name === 'Failover Manager');
    if (failoverManagerStep) {
      failoverManagerStep.status = hasQuorum ? 'success' : 'error';
      failoverManagerStep.tooltip = hasQuorum 
        ? `Write quorum achieved: ${readyReplicas} replicas are Ready (${writeQuorum} required)`
        : `Write quorum lost: Only ${readyReplicas} replicas are Ready (${writeQuorum} required)`;
    }

    return hasQuorum;
  }

  checkSystemServicesStatus(applicationHealth: IRawApplicationHealth, fmHasQuorum: boolean): void {
    const healthState = applicationHealth.AggregatedHealthState;
    const isOk = healthState === 'Ok' && fmHasQuorum;

    // Update System Services status based on AggregatedHealthState and FM quorum
    const systemServicesStep = this.recoverySteps.find(step => step.name === 'System Services');
    if (systemServicesStep) {
      systemServicesStep.status = isOk ? 'success' : 'error';
      
      if (!fmHasQuorum) {
        // Failover Manager in quorum loss - override message
        systemServicesStep.tooltip = 'Failover Manager is in quorum loss';
      } else {
        // Use health state message
        systemServicesStep.tooltip = isOk 
          ? 'System application health is Ok'
          : `System application health is ${healthState}`;
      }
    }
  }

  checkNodesStatus(rawNodes: IRawNode[]): void {
    const totalNodes = rawNodes.length;
    const upNodes = rawNodes.filter(node => node.NodeStatus === 'Up').length;
    const disabledNodes = rawNodes.filter(node => node.NodeStatus === 'Disabled' || node.NodeStatus === 'Disabling');
    const downNodes = rawNodes.filter(node => node.NodeStatus === 'Down');
    const seedNodeCount = rawNodes.filter(node => node.IsSeedNode).length;
    
    // Calculate minimum required nodes based on seed node count
    // This follows Service Fabric reliability tier guidelines
    const minRequiredNodes = seedNodeCount;
    const hasMinimumNodes = upNodes >= minRequiredNodes;

    // Update Nodes status - error if down nodes or insufficient up nodes, warning if disabled nodes, success otherwise
    const nodesStep = this.recoverySteps.find(step => step.name === 'Nodes');
    if (nodesStep) {
      if (!hasMinimumNodes || downNodes.length > 0) {
        nodesStep.status = 'error';
        
        if (!hasMinimumNodes) {
          nodesStep.tooltip = `Insufficient nodes Up: ${upNodes}/${totalNodes} nodes Up (minimum ${minRequiredNodes} required based on ${seedNodeCount} seed nodes)`;
        } else if (downNodes.length > 0) {
          nodesStep.tooltip = `${downNodes.length} node(s) are Down`;
        }
      } else if (disabledNodes.length > 0) {
        nodesStep.status = 'warning';
        nodesStep.tooltip = `${disabledNodes.length} node(s) are Disabled or Disabling`;
      } else {
        nodesStep.status = 'success';
        nodesStep.tooltip = `All ${totalNodes} nodes are Up`;
      }
    }
  }
}