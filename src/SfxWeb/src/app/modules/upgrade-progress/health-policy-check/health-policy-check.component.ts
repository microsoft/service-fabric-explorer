import { Component, OnChanges, Input } from '@angular/core';
import { IRawMonitoringPolicy } from 'src/app/Models/RawDataTypes';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-health-policy-check',
  templateUrl: './health-policy-check.component.html',
  styleUrls: ['./health-policy-check.component.scss']
})
export class HealthPolicyCheckComponent implements OnChanges {

  @Input() healthCheckPhase: string;
  @Input() healthCheckPhaseDuration: string;
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

  //phase diagram
  currentPhaseIndex = 1;
  failed = false;

  constructor() { }

  ngOnChanges(): void {
    const healthCheckRetryTimeout = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds);
    const healthCheckStableDuration = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds);
    const healthCheckWaitDuration = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckWaitDurationInMilliseconds);

    let minDurationLeft: string = "";
    let middlePhase = `Stable Duration Check  - ${healthCheckStableDuration}`;
    let middleTooltip = `The upgrade must be healthy as defined by the monitoring policies for ${healthCheckStableDuration} before completing the health policy check.`
    this.healthCheckPhaseText = "Stable duration check will start after the wait duration completes.";

    this.healthCheckDurationLeft = TimeUtils.getDurationMilliseconds(this.healthCheckPhaseDuration);
    this.failed = false;

    if (this.healthCheckPhase === "WaitDuration") {
      let durationLeft = TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckWaitDurationInMilliseconds) - this.healthCheckDurationLeft;;
      durationLeft += TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds);
      minDurationLeft = TimeUtils.getDuration(durationLeft);

      this.HealthCheckDurationOverall = TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckWaitDurationInMilliseconds);
      this.displayBottomText = "Wait Time Duration Left";
      this.displayTopText = "Wait Time Elapsed";
      this.color = 'var(--accent-darkblue)';
      this.currentPhaseIndex = 1;

    } else if (this.healthCheckPhase === "Retry") {
      this.currentPhaseIndex = 2;
      minDurationLeft = TimeUtils.getDuration(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds) + " once stable";
      middlePhase = `Retry Duration Check  - ${healthCheckRetryTimeout}`;
      this.healthCheckPhaseText = "If the health policy becomes healthy, the retry check will move to stable and move towards success.";
      middleTooltip = `The upgrade has ${healthCheckRetryTimeout} to become healthy as defined by the monitoring policies or the upgrade domain will fail.`

      this.HealthCheckDurationOverall = TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckRetryTimeoutInMilliseconds);
      this.displayBottomText = "Retry Time Duration Left";
      this.displayTopText = "Retry Time out Elapsed";
      this.color = 'var(--badge-error)';
      this.failed = true;
    } else if (this.healthCheckPhase === "StableDuration") {
      this.currentPhaseIndex = 2;
      minDurationLeft = TimeUtils.getDuration(TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds) - this.healthCheckDurationLeft);
      this.healthCheckPhaseText = "If the health policy becomes unhealthy, the stable check will move to retry and potentially fail.";
      this.HealthCheckDurationOverall = TimeUtils.getDurationMilliseconds(this.monitoringPolicy.HealthCheckStableDurationInMilliseconds);
      this.displayBottomText = "Stable Time Duration Left";
      this.displayTopText = "Stable Time Elapsed";
      this.color = 'var(--badge-ok)';
    }

    this.healthPolicyProgress = [
      {
        name: `Wait Duration - ${healthCheckWaitDuration}`,
        tooltip: `The upgrade will wait ${healthCheckWaitDuration} before applying health policies to start stable duration.`
      },
      {
        name: middlePhase,
        tooltip: middleTooltip
      },
      {
        name: "Health Check Pass",
        tooltip: "Once health check passes the upgrade will complete the current upgrade domain."
      }
    ]

    this.healthCheckTimeLeft = {
      descriptionName: 'Minimum Time Left To Pass',
      copyTextValue: minDurationLeft,
      displayText: minDurationLeft,
    }
  }
}
