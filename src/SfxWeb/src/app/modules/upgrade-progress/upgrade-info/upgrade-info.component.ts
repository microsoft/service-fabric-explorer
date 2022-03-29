import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApplicationUpgradeProgress } from 'src/app/Models/DataModels/Application';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-upgrade-info',
  templateUrl: './upgrade-info.component.html',
  styleUrls: ['./upgrade-info.component.scss']
})
export class UpgradeInfoComponent implements OnChanges, OnInit {

  @Input() upgradeProgress: ClusterUpgradeProgress | ApplicationUpgradeProgress;

  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  startTimeEssentialItem: IEssentialListItem;

  helpText = '';
  link = 'https://docs.microsoft.com/azure/service-fabric/service-fabric-application-upgrade#rolling-upgrades-overview';

  // When an upgrade is not in progress dont show a progress bar.
  // this is to avoid confusion
  upgradeDuration: IEssentialListItem;

  constructor(private settings: SettingsService) { }

  ngOnInit() {
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('clusterUpgradeProgressUnhealthyEvaluations');
  }

  ngOnChanges(): void {
    let entitySpecificInformation = [];
    if (this.upgradeProgress instanceof  ClusterUpgradeProgress) {
      entitySpecificInformation = [
        {
          descriptionName: 'Code Version',
          copyTextValue: this.upgradeProgress.raw.CodeVersion,
          displayText: this.upgradeProgress.raw.CodeVersion,
        },
        {
          descriptionName: 'Config Version',
          copyTextValue: this.upgradeProgress.raw.ConfigVersion,
          displayText: this.upgradeProgress.raw.ConfigVersion,
        }
      ];
    }else if (this.upgradeProgress instanceof ApplicationUpgradeProgress) {
      entitySpecificInformation = [
        {
          descriptionName: 'Target Version',
          copyTextValue: this.upgradeProgress.raw.TargetApplicationTypeVersion,
          displayText: this.upgradeProgress.raw.TargetApplicationTypeVersion,
        }
      ];
    }

    this.essentialItems = entitySpecificInformation.concat([

      {
        descriptionName: 'Upgrade State',
        copyTextValue: this.upgradeProgress.raw.UpgradeState,
        displayText: this.upgradeProgress.raw.UpgradeState,
      },
      {
        descriptionName: 'Upgrade Mode',
        copyTextValue: this.upgradeProgress.raw.RollingUpgradeMode,
        displayText: this.upgradeProgress.raw.RollingUpgradeMode,
      }
    ]);

    this.startTimeEssentialItem = {
      descriptionName: 'Start Timestamp UTC',
      copyTextValue: this.upgradeProgress.startTimestampUtc,
      displayText: this.upgradeProgress.startTimestampUtc,
      displaySelector: true
    };

    if (!this.upgradeProgress.isUDUpgrade && this.upgradeProgress.isUpgrading) {
      this.essentialItems.push({
        descriptionName: 'Upgrade Type',
        displayText: 'Node by Node',
      });
    }

    if (this.upgradeProgress.isUpgrading && this.upgradeProgress.isUDUpgrade) {
      this.essentialItems2 = [
        {
          descriptionName: 'Current Upgrade Domain',
          copyTextValue: this.upgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
          displayText: this.upgradeProgress.raw.CurrentUpgradeDomainProgress.DomainName,
        },
      ];

      this.helpText = 'Failure Action : ' + this.upgradeProgress.raw.UpgradeDescription.MonitoringPolicy.FailureAction;
    }else {
      this.upgradeDuration = {
        descriptionName: 'Duration',
        copyTextValue: this.upgradeProgress.upgradeDuration,
        displayText: this.upgradeProgress.upgradeDuration
      };
    }
  }
}
