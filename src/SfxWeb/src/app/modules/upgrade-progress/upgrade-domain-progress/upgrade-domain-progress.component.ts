import { Component, OnInit, Input } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { IRawUpgradeDomainProgress, IRawServiceNameInfo, IRawApplicationNameInfo, IRawPartition } from 'src/app/Models/RawDataTypes';
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
    console.log(partition)

    const serviceName = await this.restClientService.getServiceNameInfo(id).toPromise();
    console.log(serviceName);
    const applicationName = await this.restClientService.getApplicationNameInfo(serviceName.Id).toPromise();
    console.log(applicationName);
    this.partitions[id] = {
      serviceName,
      applicationName,
      partition
    }
  }

}
