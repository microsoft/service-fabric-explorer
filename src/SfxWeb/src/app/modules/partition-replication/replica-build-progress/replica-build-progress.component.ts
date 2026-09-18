import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IRawRemoteReplicatorStatus, IRawRemoteInbuildReplicaStatus, IRawConfigurationEpoch, IRawKeyValueStoreProviderCopyDetail } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

// Position of each InbuildPhase enum value in the build pipeline -- also used to decide which
// Overview sections are still greyed out (not yet reached).
const inbuildPhaseOrder: Record<string, number> = {
  CopyContext: 1,
  CopyState: 2,
  Copy: 3,
  CopyCatchup: 4,
  CopyComplete: 5
};

// Shown in place of a value the current phase hasn't produced yet.
const PLACEHOLDER = '\u2014';

// FABRIC_KEY_VALUE_STORE_REPLICA_COPY_TYPE / _MODE / _REASON (FabricTypes.h) -- the REST API
// serializes these ESE copy-detail fields as their raw numeric enum value, with no string mapping.
const copyTypeMap: Record<number, string> = { 0: 'Unknown', 1: 'Full', 2: 'Partial' };

const copyTypeReasonMap: Record<number, string> = {
  0: 'Unknown',
  1: 'InvalidSecondaryEpoch',
  2: 'EmptySecondary',
  3: 'FalseProgress',
  4: 'MatchedConfigurationNumber',
  5: 'EpochNotFound',
  6: 'StaleSecondary',
  7: 'PrimaryTombstonesNotTruncated',
};

const copyModeMap: Record<number, string> = { 0: 'Unknown', 1: 'Physical', 2: 'Logical' };

const copyModeReasonMap: Record<number, string> = {
  0: 'DefaultPhysicalCopy',
  1: 'LogicalCopyProbability',
  2: 'IncompatibleStoreFormatVersion',
  3: 'EmptyDatabase',
  4: 'FileStreamFullCopyNotSupportedBySecondary',
  5: 'FullCopyModeConfiguredAsLogical',
  6: 'EnableFileStreamFullCopySetToFalse',
};

const storeFormatVersionMap: Record<number, string> = { 0: 'Legacy', 1: 'Hop1', 2: 'Hop2Legacy' };

const contextFieldInfo: Record<string, string> = {
  'Copy Context Valid': "Whether the secondary's copy context is valid.",
  'Store Format Version': 'On-disk ESE store format used for the copy.',
  'Primary Epoch': 'Epoch (DataLossVersion:ConfigurationVersion) reported at copy negotiation.',
  'Secondary Epoch': 'Epoch (DataLossVersion:ConfigurationVersion) reported at copy negotiation.',
  'Primary Last Operation LSN': 'Last applied operation LSN reported at copy negotiation.',
  'Secondary Last Operation LSN': 'Last applied operation LSN reported at copy negotiation.',
};

const copyTypeInfoText = 'Full or partial copy, decided by comparing primary and secondary state.';
const copyModeInfoText = 'Physical (raw file) or logical (record-by-record) copy.';

// Per-value reasons (ComCopyOperationEnumerator.cpp) -- looked up by the mapped display string.
const copyTypeReasonInfoText: Record<string, string> = {
  Unknown: 'No reason recorded.',
  InvalidSecondaryEpoch: "Secondary's reported copy context epoch is invalid; forces a full copy immediately, before any progress-vector or tombstone check runs.",
  EmptySecondary: 'Secondary reports no operations at all (LastOperationLSN <= 0) -- a fresh/empty secondary; forces a full copy immediately.',
  FalseProgress: "Secondary's reported LSN/epoch is ahead of what the primary's progress vector recorded for that epoch -- an impossible history; forces a full copy.",
  MatchedConfigurationNumber: "Secondary's epoch matches an entry in the primary's progress vector by configuration number; partial copy starts from the secondary's last committed LSN + 1.",
  EpochNotFound: "No entry in the primary's progress vector matches the secondary's epoch at all; forces a full copy.",
  StaleSecondary: "Secondary already matched a configuration number, but its LSN is below the primary's tombstone low-watermark; downgrades the copy from partial to full.",
  PrimaryTombstonesNotTruncated: 'Partial copy already matched by configuration number; the tombstone-staleness check was skipped because the primary has never truncated tombstones.',
};

const copyModeReasonInfoText: Record<string, string> = {
  DefaultPhysicalCopy: 'Full copy with data to send, secondary supports file-stream copy, physical copy is enabled by configuration, and neither probability nor format mismatch forced logical -- physical (file-stream) copy is used.',
  LogicalCopyProbability: 'Selected via a probability sample against the configured LogicalCopyProbabilityInPercent, which periodically exercises the logical-copy path even when physical would otherwise qualify.',
  IncompatibleStoreFormatVersion: "Secondary's on-disk store format isn't compatible with the primary's (e.g. mid-upgrade/downgrade across ESE format versions); forces logical copy.",
  EmptyDatabase: "Primary has no operations to copy; physical file-stream copy isn't attempted.",
  FileStreamFullCopyNotSupportedBySecondary: "Secondary doesn't support receiving a file-stream full copy.",
  FullCopyModeConfiguredAsLogical: 'Physical full copy is disabled and the store is explicitly configured with FullCopyMode::Logical.',
  EnableFileStreamFullCopySetToFalse: 'Physical full copy is disabled via the EnableFileStreamFullCopy config flag (general case).',
};

export interface ILsnProgressBar {
  percent: number;
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
  // Whether this replica's *partition* can ever produce ESE-shaped copy detail -- known from
  // the primary's own ReplicaStatus (Kind + ProviderKind), independent of build phase. Neither
  // RC partitions nor TStore-backed KVS partitions ever populate these fields, no matter how
  // far the build progresses.
  @Input() isEseBackedKvs = false;

  buildStatus: IRawRemoteInbuildReplicaStatus | undefined;
  phases: IProgressStatus[] = [];
  currentIndex = 0;

  copyContextSubPhases: IProgressStatus[] = [
    { name: 'Establish Connection' },
    { name: 'Get Copy Context' },
  ];
  copyContextSubIndex = 0;
  isCopyContextActive = false;
  copySequenceItems: IEssentialListItem[] = [];
  copyPhaseProgress: ILsnProgressBar | undefined;
  catchupPhaseProgress: ILsnProgressBar | undefined;
  hasCopyProgress = false;
  hasCatchupProgress = false;

  // Shared tick labels for the combined bar -- Copy's target (Target 1) and Catchup's start
  // are the same LSN (RemoteSession.cpp:406, :516); Catchup's target is Target 2.
  lsnStartLabel = '0';
  lsnBoundaryLabel = '';
  lsnTargetLabel = '';

  // Live cursor for whichever of Copy/CopyCatchup is currently running -- undefined outside
  // those two phases (nothing moving yet, or the bar is already fully filled).
  currentLsnLabel = '';
  hasCurrentLsn = false;

  // Row-major flat lists so a CSS grid with two columns lays them out as left/right pairs.
  // Always populated (with placeholders pre-ESE-detail) so the section can be greyed out
  // in place rather than hidden/reflowed as the build advances.
  contextItems: IEssentialListItem[] = [];
  copyTypeItems: IEssentialListItem[] = [];
  hasEseDetail = false;

  ngOnChanges(): void {
    this.buildStatus = this.replicator?.RemoteInbuildReplicaStatus;
    if (!this.buildStatus) {
      return;
    }

    this.currentIndex = inbuildPhaseOrder[this.buildStatus.InbuildPhase] || 0;

    // Phase progression, with each phase's duration shown alongside it (same pattern as the
    // repair jobs stepper) -- no duration on Copy Complete itself, it's the terminal phase.
    this.phases = [
      {
        name: 'Copy Context',
        tooltip: this.buildStatus.InbuildPhase === 'CopyContext' ? `Sub-phase: ${this.buildStatus.CopyContextPhase}` : undefined,
        textRight: this.phaseDuration(this.buildStatus.CopyContextPhaseStartTimeUtc, this.buildStatus.CopyStatePhaseStartTimeUtc),
      },
      { name: 'Copy State', textRight: this.phaseDuration(this.buildStatus.CopyStatePhaseStartTimeUtc, this.buildStatus.CopyPhaseStartTimeUtc) },
      { name: 'Copy', textRight: this.phaseDuration(this.buildStatus.CopyPhaseStartTimeUtc, this.buildStatus.CopyCatchupPhaseStartTimeUtc) },
      { name: 'Copy Catchup', textRight: this.phaseDuration(this.buildStatus.CopyCatchupPhaseStartTimeUtc, undefined) },
      { name: 'Copy Complete' },
    ];

    // Greyed once the build has moved past CopyContext (index 1) -- the sub-stepper then
    // just shows its final done state instead of tracking the active phase.
    this.isCopyContextActive = this.currentIndex <= 1;
    this.copyContextSubIndex = this.isCopyContextActive
      ? (this.buildStatus.CopyContextPhase === 'GetCopyContext' ? 2 : 1)
      : 3; // past both sub-phases -- both render as done

    // Copy's target (LastCopySequenceNumber) is the primary's LSN frozen at build start;
    // CopyCatchup's target (LastCopyCatchupSequenceNumber) is frozen where Copy ends and is
    // effectively the target for the whole build (RemoteSession.cpp:406, :516).
    const copyProgress = this.lsnProgress('0', this.buildStatus.LastCopySequenceNumber, this.replicator.LastAppliedCopySequenceNumber);
    this.hasCopyProgress = !!copyProgress;
    this.copyPhaseProgress = copyProgress ?? { percent: 0 };

    const catchupProgress = this.lsnProgress(
      this.buildStatus.LastCopySequenceNumber, this.buildStatus.LastCopyCatchupSequenceNumber, this.replicator.LastAppliedReplicationSequenceNumber);
    this.hasCatchupProgress = !!catchupProgress;
    this.catchupPhaseProgress = catchupProgress ?? { percent: 0 };

    this.lsnBoundaryLabel = `Copy LSN: ${this.buildStatus.LastCopySequenceNumber}`;
    this.lsnTargetLabel = `Copy Catchup LSN: ${this.buildStatus.LastCopyCatchupSequenceNumber}`;

    this.hasCurrentLsn = this.currentIndex === 3 || this.currentIndex === 4;
    const currentCursor = this.currentIndex === 3
      ? this.replicator.LastAppliedCopySequenceNumber
      : this.replicator.LastAppliedReplicationSequenceNumber;
    this.currentLsnLabel = `Current LSN: ${this.hasCurrentLsn ? currentCursor : PLACEHOLDER}`;

    this.copySequenceItems = [
      {
        descriptionName: 'Copy Sequence Number',
        displayText: this.buildStatus.LastCopySequenceNumber,
        infoText: 'Target LSN the copy must reach to be on par with the primary as of when Copy started.',
      },
      {
        descriptionName: 'Copy Catchup Sequence Number',
        displayText: this.buildStatus.LastCopyCatchupSequenceNumber,
        infoText: 'Target replication LSN frozen when Copy completed; catchup must reach it to finish the build.',
      },
    ];

    const providerDetail = this.buildStatus.CopyDetails?.ProviderCopyDetail;
    this.hasEseDetail = providerDetail?.Kind === 'ESE';

    this.contextItems = providerDetail && this.hasEseDetail ? this.buildContextItems(providerDetail) : this.placeholderItems(contextFieldInfo);
    this.copyTypeItems = providerDetail && this.hasEseDetail
      ? this.buildCopyTypeItems(providerDetail)
      : this.placeholderItems({ 'Copy Type': copyTypeInfoText, 'Copy Type Reason': '', 'Copy Mode': copyModeInfoText, 'Copy Mode Reason': '' });
  }

  // Row-major 2-column grids need "no divider" on both cells of the final row, not just the
  // single last array element -- otherwise the left column's last row keeps a stray divider.
  isFinalRow(index: number, length: number): boolean {
    return index >= length - 2;
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

  private placeholderItems(fieldInfo: Record<string, string>): IEssentialListItem[] {
    return Object.keys(fieldInfo).map(descriptionName => ({ descriptionName, displayText: PLACEHOLDER, infoText: fieldInfo[descriptionName] || undefined }));
  }

  // The wire value is the raw numeric enum (e.g. 2), not a mapped string; fall back to
  // "<kindName>(<raw>)" for anything not in the map, mirroring the native WriteToTextWriter default.
  private mapEnum(map: Record<number, string>, raw: unknown, kindName: string): string {
    if (raw === undefined || raw === null) {
      return '';
    }
    const value = Number(raw);
    return map[value] ?? `${kindName}(${raw})`;
  }

  private lsnProgress(startStr: string, targetStr: string, cursorStr: string): ILsnProgressBar | undefined {
    const start = Number(startStr);
    const target = Number(targetStr);
    const cursor = Number(cursorStr);

    if (!isFinite(start) || !isFinite(target) || !isFinite(cursor) || target <= start) {
      return undefined;
    }

    const percent = Math.min(100, Math.max(0, ((cursor - start) / (target - start)) * 100));
    return { percent };
  }

  // Row-major left/right pairs: Copy Context Valid | Store Format Version, Primary Epoch |
  // Secondary Epoch, Primary Last Operation LSN | Secondary Last Operation LSN.
  private buildContextItems(providerDetail: IRawKeyValueStoreProviderCopyDetail): IEssentialListItem[] {
    const storeFormatVersion = this.mapEnum(storeFormatVersionMap, providerDetail.StoreFormatVersion, 'StoreFormatVersion');

    return [
      {
        descriptionName: 'Copy Context Valid',
        displayText: String(providerDetail.IsCopyContextValid),
        infoText: contextFieldInfo['Copy Context Valid'],
      },
      { descriptionName: 'Store Format Version', displayText: storeFormatVersion, infoText: contextFieldInfo['Store Format Version'] },
      {
        descriptionName: 'Primary Epoch',
        displayText: this.formatEpoch(providerDetail.PrimaryEpoch),
        infoText: contextFieldInfo['Primary Epoch'],
      },
      {
        descriptionName: 'Secondary Epoch',
        displayText: this.formatEpoch(providerDetail.SecondaryEpoch),
        infoText: contextFieldInfo['Secondary Epoch'],
      },
      {
        descriptionName: 'Primary Last Operation LSN',
        displayText: providerDetail.PrimaryLastOperationSequenceNumber,
        infoText: contextFieldInfo['Primary Last Operation LSN'],
      },
      {
        descriptionName: 'Secondary Last Operation LSN',
        displayText: providerDetail.SecondaryLastOperationSequenceNumber,
        infoText: contextFieldInfo['Secondary Last Operation LSN'],
      },
    ];
  }

  // Row-major left/right pairs: Copy Type | Copy Type Reason, Copy Mode | Copy Mode Reason.
  private buildCopyTypeItems(providerDetail: IRawKeyValueStoreProviderCopyDetail): IEssentialListItem[] {
    const copyType = this.mapEnum(copyTypeMap, providerDetail.CopyType, 'CopyType');
    const copyTypeReason = this.mapEnum(copyTypeReasonMap, providerDetail.CopyTypeReason, 'CopyTypeReason');
    const copyMode = this.mapEnum(copyModeMap, providerDetail.CopyMode, 'CopyMode');
    const copyModeReason = this.mapEnum(copyModeReasonMap, providerDetail.CopyModeReason, 'CopyModeReason');

    return [
      { descriptionName: 'Copy Type', displayText: copyType, infoText: copyTypeInfoText },
      { descriptionName: 'Copy Type Reason', displayText: copyTypeReason, infoText: copyTypeReasonInfoText[copyTypeReason] },
      { descriptionName: 'Copy Mode', displayText: copyMode, infoText: copyModeInfoText },
      { descriptionName: 'Copy Mode Reason', displayText: copyModeReason, infoText: copyModeReasonInfoText[copyModeReason] },
    ];
  }

  private formatEpoch(epoch: IRawConfigurationEpoch | undefined): string {
    return epoch ? `${epoch.DataLossVersion}:${epoch.ConfigurationVersion}` : '';
  }
}
