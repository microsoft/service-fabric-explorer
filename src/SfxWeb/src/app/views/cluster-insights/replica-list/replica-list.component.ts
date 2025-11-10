import { Component, OnInit } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter } from 'src/app/Models/ListSettings';

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
      new ListColumnSetting('raw.NodeName', 'Node Name'),
      new ListColumnSettingWithFilter('role', 'Replica Role'),
      new ListColumnSettingWithFilter('healthState', 'Health State'),
      new ListColumnSettingWithFilter('raw.ReplicaStatus', 'Status')
    ];
  
    this.listSettings = new ListSettings(10, null, 'replicas', columnSettings);
  }

  fetchReplicaData(): void {
    const applicationId = 'System';
    const serviceId = 'System/FailoverManagerService';
    const partitionId = '00000000-0000-0000-0000-000000000001';

    this.restClientService.getReplicasOnPartition(applicationId, serviceId, partitionId).subscribe(replicas => {
      this.replicaData = replicas.map(replica => ({
        id: replica.ReplicaId,
        raw: replica,
        role: replica.ReplicaRole,
        healthState: replica.HealthState,
        replicaStatus: replica.ReplicaStatus,
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