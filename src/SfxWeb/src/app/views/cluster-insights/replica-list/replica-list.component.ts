import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-replica-list',
  templateUrl: './replica-list.component.html',
  styleUrls: ['./replica-list.component.scss']
})
export class ReplicaListComponent implements OnInit {
  listSettings: ListSettings;
  replicaData: any[] = [];
  recoveryPercentage: number = 0;


  constructor(private restClientService: RestClientService) { }

  ngOnInit(): void {
    this.setupReplicaList();
    this.fetchReplicaData(); 
  }

  setupReplicaList(): void {
    console.log('Setting up replica list settings');
    const columnSettings = [
      new ListColumnSettingWithFilter('id', 'Id'),
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSettingWithFilter('previousReplicaRole', 'Previous Replica Role'),
      new ListColumnSettingWithFilter('role', 'Current Replica Role'),
      new ListColumnSettingForBadge('replicaStatusBadge', 'Status')
    ];
  
    this.listSettings = new ListSettings(10, null, 'replicas', columnSettings);
  }

  fetchReplicaData(): void {
    const applicationId = 'System';
    const serviceId = 'System/FailoverManagerService';
    const partitionId = '00000000-0000-0000-0000-000000000001';

    // Fetch both replicas and nodes to get node status
    forkJoin({
      replicas: this.restClientService.getReplicasOnPartition(applicationId, serviceId, partitionId),
      nodes: this.restClientService.getNodes()
    }).subscribe(({replicas, nodes}) => {
      // Create a map of node name to node status for quick lookup
      const nodeStatusMap = new Map(nodes.map(node => [node.Name, node.NodeStatus]));

      this.replicaData = replicas.map(replica => ({
        id: replica.ReplicaId,
        nodeName: replica.NodeName,
        raw: {
          ...replica,
          NodeStatus: nodeStatusMap.get(replica.NodeName) || 'Unknown'
        },
        previousReplicaRole: replica.PreviousReplicaRole,
        role: replica.ReplicaRole,
        replicaStatus: replica.ReplicaStatus,
        replicaStatusBadge: {
          text: replica.ReplicaStatus,
          badgeClass: replica.ReplicaStatus === 'Ready' ? 'badge-ok' : 'badge-error'
        }
      }));

      this.calculateRecoveryPercentage();
    });
  }

  calculateRecoveryPercentage(): void {
    console.log(this.replicaData);
    const totalReplicas = this.replicaData.length;
    const replicasUp = this.replicaData.filter(replica => replica.replicaStatus === 'Ready').length;

    this.recoveryPercentage = totalReplicas > 0 ? (replicasUp / totalReplicas) * 100 : 0;
  }
}