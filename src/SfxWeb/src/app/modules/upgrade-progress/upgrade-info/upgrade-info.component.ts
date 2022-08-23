import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApplicationUpgradeProgress } from 'src/app/Models/DataModels/Application';
import { ClusterUpgradeProgress } from 'src/app/Models/DataModels/Cluster';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { SettingsService } from 'src/app/services/settings.service';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-upgrade-info',
  templateUrl: './upgrade-info.component.html',
  styleUrls: ['./upgrade-info.component.scss']
})
export class UpgradeInfoComponent implements OnChanges, OnInit {

  @Input() upgradeProgress: ClusterUpgradeProgress | ApplicationUpgradeProgress;
  @Input() upgradeInformation: any; //used to force change detection

  upgradeProgressUnhealthyEvaluationsListSettings: ListSettings;

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  failedUpgradeItems: IEssentialListItem[] = [];

  healthPolicy: IEssentialListItem[] = [];

  startTimeEssentialItem: IEssentialListItem;

  helpText = '';
  link = 'https://docs.microsoft.com/azure/service-fabric/service-fabric-application-upgrade#rolling-upgrades-overview';

  // When an upgrade is not in progress dont show a progress bar.
  // this is to avoid confusion
  upgradeDuration: IEssentialListItem;

  failed: boolean = false;
  manual: boolean = false;

  constructor(private settings: SettingsService) { }

  ngOnInit() {
    this.upgradeProgressUnhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings('clusterUpgradeProgressUnhealthyEvaluations');
  }

  ngOnChanges(): void {
    this.manual = this.upgradeProgress.raw.RollingUpgradeMode === "UnmonitoredManual";
    this.failed = this.upgradeProgress.raw.FailureReason !== 'None';

    if(this.failed) {
      this.failedUpgradeItems = [
        {
          descriptionName: 'Failure Reason',
          copyTextValue: this.upgradeProgress.raw.FailureReason,
          displayText: this.upgradeProgress.raw.FailureReason,
        },
        {
          descriptionName: 'Failure Timestamp',
          copyTextValue: this.upgradeProgress.raw.FailureTimestampUtc,
          displayText: this.upgradeProgress.raw.FailureTimestampUtc,
        },
      ]

      const domainName = this.upgradeProgress.raw.UpgradeDomainProgressAtFailure.DomainName;
      if(domainName) {
        this.failedUpgradeItems.push({
          descriptionName: 'Failure Domain',
          copyTextValue: domainName,
          displayText: domainName,
        })
      }
    }

    const monitoringPolicy = this.upgradeProgress.raw?.UpgradeDescription?.MonitoringPolicy;

    if(monitoringPolicy) {
      const healthCheckRetryTimeout = TimeUtils.getDuration(monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds);
      const healthCheckStableDuration = TimeUtils.getDuration(monitoringPolicy.HealthCheckStableDurationInMilliseconds);
      const healthCheckWaitDuration = TimeUtils.getDuration(monitoringPolicy.HealthCheckWaitDurationInMilliseconds);

      this.healthPolicy = [
        {
          descriptionName: 'Health Check Wait Duration',
          copyTextValue: healthCheckWaitDuration,
          displayText: healthCheckWaitDuration
        },
        {
          descriptionName: 'Health Check Stable Duration',
          copyTextValue: healthCheckStableDuration,
          displayText: healthCheckStableDuration
        },
        {
          descriptionName: 'Health Check Retry Time Out',
          copyTextValue: healthCheckRetryTimeout,
          displayText: healthCheckRetryTimeout
        },
      ]
    }


    let entitySpecificInformation = [];
    if (this.upgradeProgress instanceof ClusterUpgradeProgress) {
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

      const clusterHealthPolicy = this.upgradeProgress.raw?.UpgradeDescription?.ClusterHealthPolicy;

      if(clusterHealthPolicy) {
        const considerWarningAsError = clusterHealthPolicy.ConsiderWarningAsError;
        const maxPercentUnhealthyNodes = `${clusterHealthPolicy.MaxPercentUnhealthyNodes}%`;
        const maxPercentUnhealthyApps = `${clusterHealthPolicy.MaxPercentUnhealthyApplications}%`;

        this.healthPolicy = this.healthPolicy.concat([
          {
            descriptionName: 'Treat Warnings As Errors',
            copyTextValue: considerWarningAsError.toString(),
            displayText: considerWarningAsError.toString()
          },
          {
            descriptionName: 'Max Unhealthy Nodes %',
            copyTextValue: maxPercentUnhealthyNodes,
            displayText: maxPercentUnhealthyNodes
          },
          {
            descriptionName: 'Max Unhealthy Applications %',
            copyTextValue: maxPercentUnhealthyApps,
            displayText: maxPercentUnhealthyApps
          },
        ])
      }
    }else if (this.upgradeProgress instanceof ApplicationUpgradeProgress) {
      entitySpecificInformation = [
        {
          descriptionName: 'Target Version',
          copyTextValue: this.upgradeProgress.raw.TargetApplicationTypeVersion,
          displayText: this.upgradeProgress.raw.TargetApplicationTypeVersion,
        }
      ];

      const applicationHealthPolicy = this.upgradeProgress.raw?.UpgradeDescription?.ApplicationHealthPolicy;

      if(applicationHealthPolicy) {
        const considerWarningAsError = applicationHealthPolicy.ConsiderWarningAsError;
        const maxPercentUnhealthyApps = `${applicationHealthPolicy.MaxPercentUnhealthyDeployedApplications}%`;

        this.healthPolicy = this.healthPolicy.concat([
          {
            descriptionName: 'Treat Warnings As Errors',
            copyTextValue: considerWarningAsError.toString(),
            displayText: considerWarningAsError.toString()
          },
          {
            descriptionName: 'Max Unhealthy Deployed Applications %',
            copyTextValue: maxPercentUnhealthyApps,
            displayText: maxPercentUnhealthyApps
          },
        ])
      }
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

    console.log(this)
  }
}
