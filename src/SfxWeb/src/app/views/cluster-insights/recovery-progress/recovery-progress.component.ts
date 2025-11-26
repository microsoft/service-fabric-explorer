import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IRawApplicationHealth, IRawNode, IRawReplicaOnPartition } from 'src/app/Models/RawDataTypes';
import { forkJoin } from 'rxjs';

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

  constructor(private restClient: RestClientService) { }

  ngOnInit(): void {
    this.checkRecoveryStatus();
  }

  checkRecoveryStatus(): void {
    // Check all recovery steps in parallel
    forkJoin({
      fmmNodes: this.restClient.getFMMNodes(),
      failoverManagerReplicas: this.restClient.getReplicasOnPartition('System', 'System/FailoverManagerService', '00000000-0000-0000-0000-000000000001'),
      systemAppHealth: this.restClient.getApplicationHealth('System')
    }).subscribe({
      next: (results) => {
        this.checkSeedNodeQuorum(results.fmmNodes);
        this.checkFailoverManagerStatus(results.failoverManagerReplicas);
        this.checkSystemServicesStatus(results.systemAppHealth);
        this.checkNodesStatus(results.fmmNodes);
      },
      error: (error) => {
        // Error loading recovery status
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

  checkFailoverManagerStatus(replicas: IRawReplicaOnPartition[]): void {
    const readyReplicas = replicas.filter(replica => replica.ReplicaStatus === 'Ready').length;
    const totalReplicas = replicas.length;
    
    // Calculate write quorum using the accurate formula
    const writeQuorum = this.calculateWriteQuorum(replicas);
    const hasQuorum = readyReplicas >= writeQuorum;

    // Update Failover Manager status based on write quorum
    const failoverManagerStep = this.recoverySteps.find(step => step.name === 'Failover Manager');
    if (failoverManagerStep) {
      failoverManagerStep.status = hasQuorum ? 'success' : 'error';
      failoverManagerStep.tooltip = hasQuorum 
        ? `Write quorum achieved: ${readyReplicas}/${totalReplicas} replicas are Ready (${writeQuorum} required)`
        : `Write quorum lost: Only ${readyReplicas}/${totalReplicas} replicas are Ready (${writeQuorum} required)`;
    }
  }

  checkSystemServicesStatus(applicationHealth: IRawApplicationHealth): void {
    const healthState = applicationHealth.AggregatedHealthState;
    const isOk = healthState === 'Ok';

    // Update System Services status based on AggregatedHealthState
    const systemServicesStep = this.recoverySteps.find(step => step.name === 'System Services');
    if (systemServicesStep) {
      systemServicesStep.status = isOk ? 'success' : 'error';
      systemServicesStep.tooltip = isOk 
        ? 'System application health is Ok'
        : `System application health is ${healthState}`;
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
    const allNodesUp = disabledNodes.length === 0 && downNodes.length === 0;
    const hasMinimumNodes = upNodes >= minRequiredNodes;

    // Update Nodes status - error if up nodes < seed nodes or any node is Disabled/Disabling/Down, success otherwise
    const nodesStep = this.recoverySteps.find(step => step.name === 'Nodes');
    if (nodesStep) {
      const isHealthy = allNodesUp && hasMinimumNodes;
      nodesStep.status = isHealthy ? 'success' : 'error';
      
      if (!hasMinimumNodes) {
        nodesStep.tooltip = `Insufficient nodes Up: ${upNodes}/${totalNodes} nodes Up (minimum ${minRequiredNodes} required based on ${seedNodeCount} seed nodes)`;
      } else if (disabledNodes.length > 0 || downNodes.length > 0) {
        const issues: string[] = [];
        if (disabledNodes.length > 0) {
          issues.push(`${disabledNodes.length} node(s) are Disabled or Disabling`);
        }
        if (downNodes.length > 0) {
          issues.push(`${downNodes.length} node(s) are Down`);
        }
        nodesStep.tooltip = issues.join(', ');
      } else {
        nodesStep.tooltip = `All ${totalNodes} nodes are Up`;
      }
    }
  }
}