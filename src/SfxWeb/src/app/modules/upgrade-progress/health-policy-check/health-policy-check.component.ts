import { Component, OnChanges, Input } from '@angular/core';
import { IRawMonitoringPolicy, IRawUpgradeHealthCheckPhase } from 'src/app/Models/RawDataTypes';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-health-policy-check',
  templateUrl: './health-policy-check.component.html',
  styleUrls: ['./health-policy-check.component.scss']
})
export class HealthPolicyCheckComponent implements OnChanges {

  @Input() healthCheck: IRawUpgradeHealthCheckPhase;
  @Input() monitoringPolicy: IRawMonitoringPolicy;


  healthPolicyProgress: IProgressStatus[] = []

  healthCheckPhaseText: string = "";
  healthCheckTimeLeft: IEssentialListItem;

  //duration graph
  healthCheckDurationLeft: number;
  HealthCheckDurationOverall: number;
  displayTopText: string = "";
  displayBottomText: string = "";
  color: string = "";

  constructor() { }

  ngOnChanges(): void {
    const healthCheckRetryTimeout = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds);
    const healthCheckStableDuration = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds);
    const healthCheckWaitDuration = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckWaitDurationInMilliseconds);

    let minDurationLeft: string = "";
    let middlePhase = `Stable Duration Check  - ${healthCheckStableDuration}`;
    this.healthCheckPhaseText = "Stable duration check will start after the wait duration completes.";

    this.healthCheckDurationLeft = this.healthCheck.TimeElapsedInMilliseconds;

    if (this.healthCheck.Phase === "Wait") {
      let durationLeft = +this.monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds - this.healthCheck.TimeElapsedInMilliseconds;
      durationLeft += +this.monitoringPolicy.HealthCheckStableDurationInMilliseconds;
      minDurationLeft = TimeUtils.getDuration(durationLeft);

      this.HealthCheckDurationOverall = +this.monitoringPolicy.HealthCheckWaitDurationInMilliseconds;
      this.displayBottomText = "Wait Time Duration";
      this.displayTopText = "Wait Time Elapsed";
      this.color = 'var(--accent-darkblue)';
    } else if (this.healthCheck.Phase === "Retry") {
      minDurationLeft = TimeUtils.getDuration(+this.monitoringPolicy.HealthCheckStableDurationInMilliseconds) + " once stable";
      middlePhase = `Retry Duration Check  - ${healthCheckRetryTimeout}`;
      this.healthCheckPhaseText = "If the health policy becomes healthy, the retry check will move to stable and move towards success";

      this.HealthCheckDurationOverall = +this.monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds;
      this.displayBottomText = "Retry Time Duration";
      this.displayTopText = "Retry Time out Elapsed";
      this.color = 'var(--accent-darkblue)';
    } else if (this.healthCheck.Phase === "Stable") {
      minDurationLeft = TimeUtils.getDuration(+this.monitoringPolicy.HealthCheckStableDurationInMilliseconds - this.healthCheck.TimeElapsedInMilliseconds);
      this.healthCheckPhaseText = "If the health policy becomes unhealthy, the stable check will move to retry and potentially fail";

      this.HealthCheckDurationOverall = +this.monitoringPolicy.HealthCheckStableDurationInMilliseconds;
      this.displayBottomText = "Stable Time Duration";
      this.displayTopText = "Stable Time Elapsed";
      this.color = 'var(--accent-darkblue)';
    }

    this.healthPolicyProgress = [
      {
        name: `Wait Duration - ${healthCheckWaitDuration}`
      },
      {
        name: middlePhase
      },
      {
        name: "Health Check Pass"
      }
    ]

    this.healthCheckTimeLeft = {
      descriptionName: 'Minimum Time Left To Pass',
      copyTextValue: minDurationLeft,
      displayText: minDurationLeft,
    }
  }
}
