import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IRawUpgradeDomainProgress, IRawSafetyCheckDescription, IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IPartitionData } from '../partition-info/partition-info.component';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';

@Component({
  selector: 'app-upgrade-domain-progress',
  templateUrl: './upgrade-domain-progress.component.html',
  styleUrls: ['./upgrade-domain-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeDomainProgressComponent implements OnInit {

  partitions: Record<string, IPartitionData> = {};

  @Input() upgradeDomain: IRawUpgradeDomainProgress;

  constructor(private restClientService: RestClientService,
              private cdr: ChangeDetectorRef,
              private messageService: MessageService) { }

  ngOnInit(): void {
  }

  async getPartitionInfo(id: string) {
    try {
      const partition = await this.restClientService.getPartitionById(id).toPromise();
      const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
      const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();
  
      this.partitions[id] = {
        serviceName,
        applicationName,
        partition
      }
    } catch {
      this.messageService.showMessage("There was an issue getting partition info", MessageSeverity.Err);
    }

    this.cdr.detectChanges();
  }

  nodeTrackBy(index, node: IRawNodeUpgradeProgress) {
    return node.NodeName;
  }

  safetyCheck(index, safetyCheck: IRawSafetyCheckDescription) {
    return safetyCheck.PartitionId || "nodePendingSafetyCheck";
  }

}
