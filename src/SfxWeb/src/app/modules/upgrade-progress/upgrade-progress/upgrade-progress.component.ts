import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { UpgradeDomain } from 'src/app/Models/DataModels/Shared';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-upgrade-progress',
  templateUrl: './upgrade-progress.component.html',
  styleUrls: ['./upgrade-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeProgressComponent implements OnInit, OnChanges {

  @Input() upgradeDomains: UpgradeDomain;

  essentialItems: IEssentialListItem[] = [];

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    this.essentialItems = [
      {
        descriptionName: 'Code Version',
        copyTextValue: this.clusterUpgradeProgress?.CodeVersion,
        displayText: this.clusterUpgradeProgress?.raw?.CodeVersion,
      },
    ]
  }

  ngOnInit() {
  }

}
