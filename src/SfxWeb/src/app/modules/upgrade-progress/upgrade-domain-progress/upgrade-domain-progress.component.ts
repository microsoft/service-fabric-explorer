import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IRawUpgradeDomainProgress, IRawNodeUpgradeProgress, ICurrentUpgradeUnitsProgressInfo } from 'src/app/Models/RawDataTypes';
import { IPartitionData } from '../safety-checks/safety-checks.component';

@Component({
  selector: 'app-upgrade-domain-progress',
  templateUrl: './upgrade-domain-progress.component.html',
  styleUrls: ['./upgrade-domain-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeDomainProgressComponent{

  partitions: Record<string, IPartitionData> = {};

  @Input() upgradeDomain: IRawUpgradeDomainProgress | ICurrentUpgradeUnitsProgressInfo;

  constructor() { }

  nodeTrackBy(index, node: IRawNodeUpgradeProgress) {
    return node.NodeName;
  }

}
