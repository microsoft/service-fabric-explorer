import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-replica-details-html',
  templateUrl: './replica-details-html.component.html'
})
export class ReplicaDetailsHtmlComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  deployedReplicaDetails: any;

  ngOnInit(): void {
    const details = this.item?.deployedReplicaDetails;
    
    if (details && !details.error) {
      const deployedServiceReplica = details.DeployedServiceReplica || {};
      const reconfigInfo = deployedServiceReplica.ReconfigurationInformation || {};
      
      this.deployedReplicaDetails = {
        'Host Process ID': deployedServiceReplica.HostProcessId || '',
        'Previous Configuration Role': reconfigInfo.PreviousConfigurationRole || '',
        'Reconfiguration Phase': reconfigInfo.ReconfigurationPhase || '',
        'Reconfiguration Type': reconfigInfo.ReconfigurationType || '',
        'Reconfiguration Start Time UTC': reconfigInfo.ReconfigurationStartTimeUtc || ''
      };
    }
  }
}

export class ListColumnSettingForReplicaDetailsHtml extends ListColumnSetting {
  template = ReplicaDetailsHtmlComponent;
  
  constructor(propertyPath: string, displayName: string, config?: any) {
    super(propertyPath, displayName, config);
  }
}
