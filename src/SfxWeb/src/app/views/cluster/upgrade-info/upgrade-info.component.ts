import { Component, Input, OnInit } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-upgrade-info',
  templateUrl: './upgrade-info.component.html',
  styleUrls: ['./upgrade-info.component.scss']
})
export class UpgradeInfoComponent implements OnInit {

  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  constructor() { }
  ngOnChanges(): void {
    this.essentialItems = [
      {
        descriptionName: 'Code Version',
        copyTextValue: this.clusterUpgradeProgress.raw.CodeVersion,
        displayText: this.clusterUpgradeProgress.raw.CodeVersion,
      },
      {
        descriptionName: 'Config Version',
        copyTextValue: this.clusterUpgradeProgress.raw.ConfigVersion,
        displayText: this.clusterUpgradeProgress.raw.ConfigVersion,
      },
      {
        descriptionName: 'Upgrade State',
        copyTextValue: this.clusterUpgradeProgress.raw.UpgradeState,
        displayText: this.clusterUpgradeProgress.raw.UpgradeState,
      },
      {
        descriptionName: 'Upgrade Mode',
        copyTextValue: this.clusterUpgradeProgress.raw.RollingUpgradeMode,
        displayText: this.clusterUpgradeProgress.raw.RollingUpgradeMode,
      },
      {
        descriptionName: 'Start Timestamp UTC',
        copyTextValue: this.clusterUpgradeProgress.startTimestampUtc,
        displayText: this.clusterUpgradeProgress.startTimestampUtc,
      },
      {
        descriptionName: 'Upgrade Duration',
        copyTextValue: this.clusterUpgradeProgress.upgradeDuration,
        displayText: this.clusterUpgradeProgress.upgradeDuration,
      },
    ]

    this.essentialItems2 = [
      {
        descriptionName: 'Current Upgrade Domain',
        copyTextValue: this.clusterUpgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
        displayText: this.clusterUpgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
      },
      {
        descriptionName: 'Current Upgrade Domain Duration',
        copyTextValue: this.clusterUpgradeProgress.upgradeDomainDuration,
        displayText: this.clusterUpgradeProgress.upgradeDomainDuration,
      },
    ]
  }

  ngOnInit(): void {
  }

}
