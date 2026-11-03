import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IRawRemoteReplicatorStatus, IRawRemoteInbuildReplicaStatus, IRawConfigurationEpoch, IRawKeyValueStoreProviderCopyDetail } from 'src/app/Models/RawDataTypes';
import { IEssentialListItem } from '../../charts/essential-health-tile/essential-health-tile.component';
import { IProgressStatus } from 'src/app/shared/component/phase-diagram/phase-diagram.component';
import { contextFieldInfo, copyTypeInfoText, copyModeInfoText, copyTypeReasonInfoText, copyModeReasonInfoText } from './replica-copy-info.constants';
import { computeBuildPhases } from './build-phase.util';

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
  @Input() primaryDatabaseLogicalSizeEstimate: string | undefined;
  @Input() targetCopyOperationSize: number | undefined;
  @Input() isDefaultCopyOperationSize = false;

  estimatedCopyPercent: number | undefined;
  estimatedCopyInfo = '';
  private copyEstimateBuildKey: string | undefined;
  private copyEstimateDatabaseBytes: number | undefined;
  private copyEstimateOperationBytes: number | undefined;
  private copyEstimateUsesDefault = false;

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
  progressDescription = '';

  // The boundary and catchup target are replication LSNs, not copy-stream sequence numbers.
  lsnStartLabel = '0';
  lsnBoundaryLabel = '';
  lsnTargetLabel = '';

  // Live cursor for whichever of Copy/CopyCatchup is currently running -- undefined outside
  // those two phases (nothing moving yet, or the bar is already fully filled).
  currentLsnLabel = '';
  currentSequenceInfo = '';
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
      // Clear every derived field -- otherwise a replica that loses RemoteInbuildReplicaStatus
      // between refreshes keeps showing whatever the previous refresh last computed.
      this.phases = [];
      this.currentIndex = 0;
      this.copyContextSubIndex = 0;
      this.isCopyContextActive = false;
      this.copySequenceItems = [];
      this.copyPhaseProgress = undefined;
      this.catchupPhaseProgress = undefined;
      this.hasCopyProgress = false;
      this.hasCatchupProgress = false;
      this.progressDescription = '';
      this.lsnBoundaryLabel = '';
      this.lsnTargetLabel = '';
      this.currentLsnLabel = '';
      this.currentSequenceInfo = '';
      this.hasCurrentLsn = false;
      this.contextItems = [];
      this.copyTypeItems = [];
      this.hasEseDetail = false;
      this.estimatedCopyPercent = undefined;
      this.estimatedCopyInfo = '';
      this.copyEstimateBuildKey = undefined;
      this.copyEstimateDatabaseBytes = undefined;
      this.copyEstimateOperationBytes = undefined;
      this.copyEstimateUsesDefault = false;
      return;
    }

    ({ phases: this.phases, currentIndex: this.currentIndex } = computeBuildPhases(this.buildStatus));

    // Whether the build is still in (or hasn't yet passed) CopyContext -- once past, the
    // sub-stepper just shows its final done state instead of tracking the active sub-phase.
    this.isCopyContextActive = this.currentIndex <= 1;
    this.copyContextSubIndex = this.isCopyContextActive
      ? (this.buildStatus.CopyContextPhase === 'GetCopyContext' ? 2 : 1)
      : 3; // past both sub-phases -- both render as done

    const providerDetail = this.buildStatus.CopyDetails?.ProviderCopyDetail;
    this.hasEseDetail = providerDetail?.Kind === 'ESE';

    // Freeze both estimate inputs together on the first valid observation during Copy.
    const estimateBuildKey = `${this.replicator.ReplicaId}:${this.buildStatus.CopyContextPhaseStartTimeUtc}:${this.buildStatus.LastCopySequenceNumber}`;
    if (estimateBuildKey !== this.copyEstimateBuildKey) {
      this.copyEstimateBuildKey = estimateBuildKey;
      this.copyEstimateDatabaseBytes = undefined;
      this.copyEstimateOperationBytes = undefined;
      this.copyEstimateUsesDefault = false;
    }
    this.estimatedCopyPercent = undefined;
    this.estimatedCopyInfo = '';
    const operationBytes = this.targetCopyOperationSize;
    const hasValidOperationSize = operationBytes !== undefined && Number.isSafeInteger(operationBytes) &&
      operationBytes > 0 && operationBytes <= 2147483647;
    if (this.currentIndex === 3 && this.isEseBackedKvs && this.hasEseDetail &&
        providerDetail?.CopyType === 1 && providerDetail.CopyMode === 2) {
      const databaseBytes = Number(this.primaryDatabaseLogicalSizeEstimate);
      if (this.copyEstimateDatabaseBytes === undefined && Number.isSafeInteger(databaseBytes) && databaseBytes > 0 &&
          hasValidOperationSize) {
        this.copyEstimateDatabaseBytes = databaseBytes;
        this.copyEstimateOperationBytes = operationBytes;
        this.copyEstimateUsesDefault = this.isDefaultCopyOperationSize;
      }
      const appliedCopyOperations = Number(this.replicator.LastAppliedCopySequenceNumber);
      if (this.copyEstimateDatabaseBytes !== undefined && this.copyEstimateOperationBytes !== undefined &&
          this.replicator.LastAppliedCopySequenceNumber?.trim() &&
          Number.isSafeInteger(appliedCopyOperations) && appliedCopyOperations >= 0) {
        this.estimatedCopyPercent = Math.min(99,
          appliedCopyOperations * this.copyEstimateOperationBytes / this.copyEstimateDatabaseBytes * 100);
        const source = this.copyEstimateUsesDefault
          ? 'native default; setting absent from cluster manifest'
          : 'cluster manifest ReplicatedStore/TargetCopyOperationSize';
        this.estimatedCopyInfo = `Uses ${this.copyEstimateOperationBytes} bytes per copy operation (${source}) and primary logical size at first observation. Actual operation sizes vary and the runtime may reduce the target to fit replication message limits; not measured bytes.`;
      }
    }

    const copyTarget = Number(this.buildStatus.LastCopySequenceNumber);
    this.hasCopyProgress = this.currentIndex >= 3 && isFinite(copyTarget) && copyTarget >= 0;
    this.copyPhaseProgress = { percent: this.currentIndex >= 4 ? 100 : this.estimatedCopyPercent ?? 0 };

    const catchupProgress = this.lsnProgress(
      this.buildStatus.LastCopySequenceNumber, this.buildStatus.LastCopyCatchupSequenceNumber, this.replicator.LastAppliedReplicationSequenceNumber);
    this.hasCatchupProgress = this.currentIndex >= 4 && !!catchupProgress;
    this.catchupPhaseProgress = catchupProgress ?? { percent: 0 };
    this.progressDescription = this.currentIndex === 3
      ? this.estimatedCopyPercent !== undefined
        ? `Estimated Copy Progress: ${Math.floor(this.estimatedCopyPercent)}%`
        : this.isEseBackedKvs && providerDetail?.CopyType === 1 && providerDetail.CopyMode === 2 &&
            !hasValidOperationSize
          ? 'Copy stream in progress; percentage unavailable: TargetCopyOperationSize is unavailable or invalid.'
          : 'Copy stream in progress; percentage unavailable.'
      : this.currentIndex === 4
        ? !catchupProgress
          ? 'Waiting for catchup progress data.'
          : catchupProgress.percent === 0
            ? 'Waiting for applied replication progress; copy acknowledgments may still be pending.'
            : catchupProgress.percent === 100
              ? 'Replication catchup target reached; waiting for build completion.'
              : 'Applying replication operations.'
        : '';

    this.lsnBoundaryLabel = `Copy LSN: ${this.buildStatus.LastCopySequenceNumber}`;
    this.lsnTargetLabel = `Copy Catchup LSN: ${this.buildStatus.LastCopyCatchupSequenceNumber}`;

    this.hasCurrentLsn = this.currentIndex === 3 || this.currentIndex === 4;
    const currentCursor = this.currentIndex === 3
      ? this.replicator.LastAppliedCopySequenceNumber
      : this.replicator.LastAppliedReplicationSequenceNumber;
    const currentSequenceLabel = this.currentIndex === 3 ? 'Current CSN' : 'Current LSN';
    this.currentLsnLabel = `${currentSequenceLabel}: ${this.hasCurrentLsn ? currentCursor : PLACEHOLDER}`;
    this.currentSequenceInfo = this.currentIndex === 3
      ? 'Applied copy-stream sequence number (CSN); not a replication LSN.'
      : this.currentIndex === 4
        ? 'Applied replication LSN; advances only when replication operations are applied.'
        : 'Not available until Copy starts. Shows the applied copy-stream sequence number (CSN) during Copy, then the applied replication LSN during CopyCatchup.';

    this.copySequenceItems = [
      {
        descriptionName: 'Copy Sequence Number',
        displayText: this.buildStatus.LastCopySequenceNumber,
        infoText: 'Replication LSN captured at build start. It is the catchup starting boundary, not the total number of copy-stream operations.',
      },
      {
        descriptionName: 'Copy Catchup Sequence Number',
        displayText: this.buildStatus.LastCopyCatchupSequenceNumber,
        infoText: 'Target replication LSN frozen when copy enumeration ended. Catchup waits for outstanding copy and replication acknowledgments.',
      },
    ];

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

    if (!isFinite(start) || !isFinite(target) || !isFinite(cursor) || start < 0 || target < start || cursor < 0) {
      return undefined;
    }

    const percent = target === start
      ? (cursor >= target ? 100 : 0)
      : Math.min(100, Math.max(0, ((cursor - start) / (target - start)) * 100));
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
      { descriptionName: 'Copy Type Reason', displayText: copyTypeReason, infoText: copyTypeReasonInfoText[copyTypeReason], allowWrap: true },
      { descriptionName: 'Copy Mode', displayText: copyMode, infoText: copyModeInfoText },
      { descriptionName: 'Copy Mode Reason', displayText: copyModeReason, infoText: copyModeReasonInfoText[copyModeReason], allowWrap: true },
    ];
  }

  private formatEpoch(epoch: IRawConfigurationEpoch | undefined): string {
    return epoch ? `${epoch.DataLossVersion}:${epoch.ConfigurationVersion}` : '';
  }
}
