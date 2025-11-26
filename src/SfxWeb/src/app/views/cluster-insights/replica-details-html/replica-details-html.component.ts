import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-replica-details-html',
  templateUrl: './replica-details-html.component.html',
  styleUrls: ['./replica-details-html.component.scss']
})
export class ReplicaDetailsHtmlComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  deployedReplicaDetails: any;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    // Get the raw deployed replica details
    const details = this.item?.deployedReplicaDetails;
    
    if (details && !details.error) {
      // Extract the relevant information for display
      const deployedServiceReplica = details.DeployedServiceReplica || {};
      const reconfigInfo = deployedServiceReplica.ReconfigurationInformation || {};
      
      // Structure the data for app-detail-view-part - only the 5 required fields
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
