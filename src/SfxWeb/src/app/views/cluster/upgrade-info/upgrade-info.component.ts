import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-upgrade-info',
  templateUrl: './upgrade-info.component.html',
  styleUrls: ['./upgrade-info.component.scss']
})
export class UpgradeInfoComponent implements OnInit, OnChanges {

  @Input() clusterUpgradeProgress: ClusterUpgradeProgress;

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  helpText = '';
  link = 'https://docs.microsoft.com/azure/service-fabric/service-fabric-application-upgrade#rolling-upgrades-overview';
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
    ];

    this.essentialItems2 = [
      {
        descriptionName: 'Current Upgrade Domain',
        copyTextValue: this.clusterUpgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
        displayText: this.clusterUpgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
      },
    ];

    this.helpText = 'Failure Action : ' + this.clusterUpgradeProgress.raw.UpgradeDescription.MonitoringPolicy.FailureAction;
  }

  ngOnInit(): void {
  }

}
