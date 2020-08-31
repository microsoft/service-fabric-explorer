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

  constructor() { }

  ngOnInit(): void {
  }

  nodeTrackBy(index, node: IRawNodeUpgradeProgress) {
    return node.NodeName;
  }

}
