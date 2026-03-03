import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-replica-details',
  templateUrl: './replica-details.component.html'
})
export class ReplicaDetailsComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  detailedInfo: any;

  ngOnInit(): void {
    if (this.item?.deployedReplicaCounts && typeof this.item.deployedReplicaCounts === 'object') {
      this.detailedInfo = this.item.deployedReplicaCounts;
    } else if (this.item?.deployedReplicaDetails && !this.item.deployedReplicaDetails.error) {
      // Handle deployed replica details (for replica list component)
      this.detailedInfo = this.buildDetailedInfo(this.item.deployedReplicaDetails);
    }
  }

  private buildDetailedInfo(details: any): any {
    const deployedServiceReplica = details.DeployedServiceReplica || {};
    const reconfigInfo = deployedServiceReplica.ReconfigurationInformation || {};
    return {
      'Host Process ID': deployedServiceReplica.HostProcessId || '',
      'Previous Configuration Role': reconfigInfo.PreviousConfigurationRole || '',
      'Reconfiguration Phase': reconfigInfo.ReconfigurationPhase || '',
      'Reconfiguration Type': reconfigInfo.ReconfigurationType || '',
      'Reconfiguration Start Time UTC': reconfigInfo.ReconfigurationStartTimeUtc || ''
    };
  }
}

export class ListColumnSettingForExpandedDetails extends ListColumnSetting {
  template = ReplicaDetailsComponent;
  
  constructor(propertyPath: string, displayName: string, config?: any) {
    super(propertyPath, displayName, config);
  }
}
