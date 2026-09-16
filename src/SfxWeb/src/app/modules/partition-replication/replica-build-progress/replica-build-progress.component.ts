import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IRawRemoteReplicatorStatus, IRawRemoteInbuildReplicaStatus, IRawConfigurationEpoch, IRawKeyValueStoreProviderCopyDetail } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

// Position of each InbuildPhase enum value in the build pipeline (PR 16130941).
const inbuildPhaseOrder: Record<string, number> = {
  CopyContext: 1,
  CopyState: 2,
  Copy: 3,
  CopyCatchup: 4,
  CopyComplete: 5
};

export interface ILsnProgressBar {
  percent: number;
  leftLabel: string;
  rightLabel: string;
}

@Component({
    selector: 'app-replica-build-progress',
    templateUrl: './replica-build-progress.component.html',
    styleUrls: ['./replica-build-progress.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReplicaBuildProgressComponent implements OnChanges {
  @Input() replicator!: IRawRemoteReplicatorStatus;

  buildStatus: IRawRemoteInbuildReplicaStatus | undefined;
  phases: IProgressStatus[] = [];
  currentIndex = 0;

  overviewItems: IEssentialListItem[] = [];
  copyPhaseProgress: ILsnProgressBar | undefined;
  catchupPhaseProgress: ILsnProgressBar | undefined;

  eseItems: IEssentialListItem[] = [];
  hasEseDetail = false;

  ngOnChanges(): void {
    this.buildStatus = this.replicator?.RemoteInbuildReplicaStatus;
    if (!this.buildStatus) {
      return;
    }

    this.currentIndex = inbuildPhaseOrder[this.buildStatus.InbuildPhase] || 0;

    // Phase progression only -- no timestamps on the stepper itself.
    this.phases = [
      {
        name: 'Copy Context',
        tooltip: this.buildStatus.InbuildPhase === 'CopyContext' ? `Sub-phase: ${this.buildStatus.CopyContextPhase}` : undefined,
      },
      { name: 'Copy State' },
      { name: 'Copy' },
      { name: 'Copy Catchup' },
      { name: 'Copy Complete' },
    ];

    this.overviewItems = [
      { descriptionName: 'Current Phase', displayText: this.currentPhaseLabel(this.buildStatus), copyTextValue: this.buildStatus.InbuildPhase },
      {
        descriptionName: 'Copy Context Duration',
        displayText: this.phaseDuration(this.buildStatus.CopyContextPhaseStartTimeUtc, this.buildStatus.CopyStatePhaseStartTimeUtc),
      },
      {
        descriptionName: 'Copy State Duration',
        displayText: this.phaseDuration(this.buildStatus.CopyStatePhaseStartTimeUtc, this.buildStatus.CopyPhaseStartTimeUtc),
      },
      {
        descriptionName: 'Copy Duration',
        displayText: this.phaseDuration(this.buildStatus.CopyPhaseStartTimeUtc, this.buildStatus.CopyCatchupPhaseStartTimeUtc),
      },
      {
        descriptionName: 'Copy Catchup Duration',
        displayText: this.phaseDuration(this.buildStatus.CopyCatchupPhaseStartTimeUtc, undefined),
      },
    ];

    // Copy's target (LastCopySequenceNumber) is the primary's LSN frozen at build start;
    // CopyCatchup's target (LastCopyCatchupSequenceNumber) is frozen where Copy ends and is
    // effectively the target for the whole build (RemoteSession.cpp:406, :516).
    this.copyPhaseProgress = this.lsnProgress(
      '0', this.buildStatus.LastCopySequenceNumber, this.replicator.LastAppliedCopySequenceNumber,
      'Start LSN: 0', `Target LSN: ${this.buildStatus.LastCopySequenceNumber}`);

    this.catchupPhaseProgress = this.lsnProgress(
      this.buildStatus.LastCopySequenceNumber, this.buildStatus.LastCopyCatchupSequenceNumber, this.replicator.LastAppliedReplicationSequenceNumber,
      `Start LSN: ${this.buildStatus.LastCopySequenceNumber}`, `Target LSN: ${this.buildStatus.LastCopyCatchupSequenceNumber}`);

    const providerDetail = this.buildStatus.CopyDetails?.ProviderCopyDetail;
    this.hasEseDetail = providerDetail?.Kind === 'ESE';

    this.eseItems = providerDetail && this.hasEseDetail ? this.buildEseItems(providerDetail) : [];
  }

  private currentPhaseLabel(buildStatus: IRawRemoteInbuildReplicaStatus): string {
    return buildStatus.InbuildPhase === 'CopyContext'
      ? `Copy Context (${buildStatus.CopyContextPhase})`
      : buildStatus.InbuildPhase;
  }

  // Duration of a phase = time between its start and the next phase's start, or "now" if the
  // next phase (or the phase itself) hasn't started yet. "0001-01-01..." is SF's zero-DateTime
  // sentinel for "not yet reached".
  private phaseDuration(startTimestamp: string, nextStartTimestamp: string | undefined): string {
    const start = this.parseValidTime(startTimestamp);
    if (start === undefined) {
      return '';
    }

    const end = this.parseValidTime(nextStartTimestamp) ?? Date.now();
    const seconds = Math.max(0, (end - start) / 1000);
    return TimeUtils.getDurationFromSeconds(seconds.toString());
  }

  private parseValidTime(timestamp: string | undefined): number | undefined {
    if (!timestamp) {
      return undefined;
    }
    const time = new Date(timestamp).getTime();
    return (!isFinite(time) || time <= 0) ? undefined : time;
  }

  private lsnProgress(startStr: string, targetStr: string, cursorStr: string, leftLabel: string, rightLabel: string): ILsnProgressBar | undefined {
    const start = Number(startStr);
    const target = Number(targetStr);
    const cursor = Number(cursorStr);

    if (!isFinite(start) || !isFinite(target) || !isFinite(cursor) || target <= start) {
      return undefined;
    }

    const percent = Math.min(100, Math.max(0, ((cursor - start) / (target - start)) * 100));
    return { percent, leftLabel, rightLabel };
  }

  private buildEseItems(providerDetail: IRawKeyValueStoreProviderCopyDetail): IEssentialListItem[] {
    return [
      { descriptionName: 'Copy Type', copyTextValue: providerDetail.CopyType, displayText: providerDetail.CopyType },
      { descriptionName: 'Copy Type Reason', copyTextValue: providerDetail.CopyTypeReason, displayText: providerDetail.CopyTypeReason },
      { descriptionName: 'Copy Mode', copyTextValue: providerDetail.CopyMode, displayText: providerDetail.CopyMode },
      { descriptionName: 'Copy Mode Reason', copyTextValue: providerDetail.CopyModeReason, displayText: providerDetail.CopyModeReason },
      { descriptionName: 'Store Format Version', copyTextValue: providerDetail.StoreFormatVersion, displayText: providerDetail.StoreFormatVersion },
      {
        descriptionName: 'Copy Context Valid',
        copyTextValue: String(providerDetail.IsCopyContextValid),
        displayText: String(providerDetail.IsCopyContextValid),
      },
      {
        descriptionName: 'Primary Epoch',
        copyTextValue: this.formatEpoch(providerDetail.PrimaryEpoch),
        displayText: this.formatEpoch(providerDetail.PrimaryEpoch),
      },
      {
        descriptionName: 'Primary Last Operation LSN',
        copyTextValue: providerDetail.PrimaryLastOperationSequenceNumber,
        displayText: providerDetail.PrimaryLastOperationSequenceNumber,
      },
      {
        descriptionName: 'Secondary Epoch',
        copyTextValue: this.formatEpoch(providerDetail.SecondaryEpoch),
        displayText: this.formatEpoch(providerDetail.SecondaryEpoch),
      },
      {
        descriptionName: 'Secondary Last Operation LSN',
        copyTextValue: providerDetail.SecondaryLastOperationSequenceNumber,
        displayText: providerDetail.SecondaryLastOperationSequenceNumber,
      },
    ];
  }

  private formatEpoch(epoch: IRawConfigurationEpoch | undefined): string {
    return epoch ? `${epoch.DataLossVersion}:${epoch.ConfigurationVersion}` : '';
  }
}
