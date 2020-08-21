import { Component, OnInit, Input } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { IRawUpgradeDomainProgress, IRawSafetyCheckDescription, IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { IPartitionData } from '../partition-info/partition-info.component';

@Component({
  selector: 'app-upgrade-domain-progress',
  templateUrl: './upgrade-domain-progress.component.html',
  styleUrls: ['./upgrade-domain-progress.component.scss']
})
export class UpgradeDomainProgressComponent implements OnInit {

  partitions: Record<string, IPartitionData> = {};

  @Input() upgradeDomain: IRawUpgradeDomainProgress;

  constructor(private restClientService: RestClientService) { }

  ngOnInit(): void {
  }

  async getPartitionInfo(id: string) {
    const partition = await this.restClientService.getPartitionById(id).toPromise();
    const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
    const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();

    this.partitions[id] = {
      serviceName,
      applicationName,
      partition
    }
  }

  nodeTrackBy(index, node: IRawNodeUpgradeProgress) {
    return node.NodeName;
  }

  safetyCheck(index, safetyCheck: IRawSafetyCheckDescription) {
    return safetyCheck.PartitionId || "nodePendingSafetyCheck";
  }

}
