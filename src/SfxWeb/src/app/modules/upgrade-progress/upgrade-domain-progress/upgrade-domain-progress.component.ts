import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IRawUpgradeDomainProgress, IRawNodeUpgradeProgress } from 'src/app/Models/RawDataTypes';
import { IPartitionData } from '../partition-info/partition-info.component';

@Component({
  selector: 'app-upgrade-domain-progress',
  templateUrl: './upgrade-domain-progress.component.html',
  styleUrls: ['./upgrade-domain-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeDomainProgressComponent{

  partitions: Record<string, IPartitionData> = {};

  @Input() upgradeDomain: IRawUpgradeDomainProgress;

  constructor() { }

  nodeTrackBy(index, node: IRawNodeUpgradeProgress) {
    return node.NodeName;
  }

}
