import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RestClientService } from 'src/app/services/rest-client.service';
import { ListSettings, ListColumnSetting, ListColumnSettingForColoredNodeName, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-replica-details',
  templateUrl: './replica-details.component.html',
  styleUrls: ['./replica-details.component.scss']
})
export class ReplicaDetailsComponent implements OnInit, OnChanges {
  @Input() replicaData: any[] = [];
  
  listSettings: ListSettings;
  replicaDetailsData: any[] = [];
  partitionId = '00000000-0000-0000-0000-000000000001';

  constructor(private restClientService: RestClientService) { }

  ngOnInit(): void {
    this.setupReplicaDetailsList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['replicaData'] && this.replicaData && this.replicaData.length > 0) {
      this.fetchReplicaDetails();
    }
  }

  setupReplicaDetailsList(): void {
    const columnSettings = [
      new ListColumnSettingForColoredNodeName('nodeName', 'Node Name'),
      new ListColumnSetting('replicaId', 'Replica ID'),
      new ListColumnSetting('replicaRole', 'Current Replica Role'),
      new ListColumnSetting('raw.CurrentReplicatorOperation', 'Current Operation'),
      new ListColumnSetting('raw.ReadStatus', 'Read Status'),
      new ListColumnSetting('raw.WriteStatus', 'Write Status')
    ];
  
    this.listSettings = new ListSettings(10, null, 'replica-details', columnSettings);
  }

  fetchReplicaDetails(): void {
    const detailRequests = this.replicaData.map(replica => 
      this.restClientService.getDeployedReplicaDetail(
        replica.raw.NodeName, 
        this.partitionId, 
        replica.id
      )
    );

    forkJoin(detailRequests).subscribe({
      next: (details) => {
        this.replicaDetailsData = details.map((detail, index) => ({
          nodeName: this.replicaData[index].nodeName,
          replicaId: this.replicaData[index].id,
          replicaRole: this.replicaData[index].raw.ReplicaRole || 'Unknown',
          raw: {
            ...detail,
            NodeStatus: this.replicaData[index].raw.NodeStatus
          }
        }));
      },
      error: (error) => {
        console.error('Error fetching replica details:', error);
        this.replicaDetailsData = [];
      }
    });
  }
}
