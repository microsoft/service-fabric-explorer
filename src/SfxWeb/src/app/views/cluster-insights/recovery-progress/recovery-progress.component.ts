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
        console.error('Error loading recovery status:', error);
      }
    });
  }

  checkSeedNodeQuorum(rawNodes: IRawNode[]): void {
    const totalSeedNodes = rawNodes.filter(node => node.IsSeedNode).length;
    const upSeedNodes = rawNodes.filter(node => node.IsSeedNode && node.NodeStatus === 'Up').length;
    const quorum = Math.floor(totalSeedNodes / 2) + 1;

    console.log('Seed Node Quorum Check:', {
      totalSeedNodes,
      upSeedNodes,
      quorum,
      hasQuorum: upSeedNodes >= quorum
    });

    // Update Seed Nodes Quorum status
    const seedNodeStep = this.recoverySteps.find(step => step.name === 'Seed Nodes Quorum');
    if (seedNodeStep) {
      seedNodeStep.status = upSeedNodes >= quorum ? 'success' : 'error';
      seedNodeStep.tooltip = upSeedNodes >= quorum 
        ? `Quorum achieved: ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`
        : `Quorum lost: Only ${upSeedNodes}/${totalSeedNodes} seed nodes are Up (${quorum} required)`;
    }
  }

  checkFailoverManagerStatus(replicas: IRawReplicaOnPartition[]): void {
    const totalReplicas = replicas.length;
    const readyReplicas = replicas.filter(replica => replica.ReplicaStatus === 'Ready').length;
    const quorum = Math.floor(totalReplicas / 2) + 1;
    const hasQuorum = readyReplicas >= quorum;
    
    console.log('Failover Manager Check:', {
      totalReplicas,
      readyReplicas,
      quorum,
      hasQuorum
    });

    // Update Failover Manager status based on replica quorum
    const failoverManagerStep = this.recoverySteps.find(step => step.name === 'Failover Manager');
    if (failoverManagerStep) {
      failoverManagerStep.status = hasQuorum ? 'success' : 'error';
      failoverManagerStep.tooltip = hasQuorum 
        ? `Quorum achieved: ${readyReplicas}/${totalReplicas} replicas are Ready (${quorum} required)`
        : `Quorum lost: Only ${readyReplicas}/${totalReplicas} replicas are Ready (${quorum} required)`;
    }
  }

  checkSystemServicesStatus(applicationHealth: IRawApplicationHealth): void {
    const healthState = applicationHealth.AggregatedHealthState;
    const isOk = healthState === 'Ok';
    
    console.log('System Services Check:', {
      aggregatedHealthState: healthState,
      isOk: isOk
    });

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
    const disabledNodes = rawNodes.filter(node => node.NodeStatus === 'Disabled');
    const allNodesUp = disabledNodes.length === 0;
    const hasMinimumNodes = totalNodes >= 9;
    
    console.log('Nodes Status Check:', {
      totalNodes,
      disabledNodes: disabledNodes.length,
      allNodesUp,
      hasMinimumNodes
    });

    // Update Nodes status - red if node count < 9 or any node is Disabled, green otherwise
    const nodesStep = this.recoverySteps.find(step => step.name === 'Nodes');
    if (nodesStep) {
      const isHealthy = allNodesUp && hasMinimumNodes;
      nodesStep.status = isHealthy ? 'success' : 'error';
      
      if (!hasMinimumNodes) {
        nodesStep.tooltip = `Insufficient nodes: ${totalNodes} nodes (minimum 9 required)`;
      } else if (!allNodesUp) {
        nodesStep.tooltip = `${disabledNodes.length} node(s) are Disabled`;
      } else {
        nodesStep.tooltip = `All ${totalNodes} nodes are Up`;
      }
    }
  }
}
