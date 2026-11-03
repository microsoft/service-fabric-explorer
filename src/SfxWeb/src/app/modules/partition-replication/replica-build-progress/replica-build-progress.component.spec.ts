import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  IRawKeyValueStoreProviderCopyDetail,
  IRawRemoteInbuildReplicaStatus,
  IRawRemoteReplicatorStatus
} from 'src/app/Models/RawDataTypes';
import { PartitionReplicationModule } from '../partition-replication.module';
import { ReplicaBuildProgressComponent } from './replica-build-progress.component';

describe('ReplicaBuildProgressComponent', () => {
  let fixture: ComponentFixture<ReplicaBuildProgressComponent>;
  let component: ReplicaBuildProgressComponent;
  let replicator: IRawRemoteReplicatorStatus;
  let buildStatus: IRawRemoteInbuildReplicaStatus;
  let providerDetail: IRawKeyValueStoreProviderCopyDetail;
  let databaseSize: string;
  let operationSize: number | undefined;

  const copyFill = () => fixture.debugElement.query(By.css('.lsn-bar-track .lsn-bar-fill'));
  const currentSequence = () => fixture.debugElement.query(By.css('[data-cy=current-lsn]'));
  const currentSequenceInfo = () => fixture.debugElement.query(By.css('[data-cy=current-sequence-info]'));
  const description = () => fixture.debugElement.query(By.css('[data-cy=copy-progress-description]'));
  const render = () => {
    fixture.componentRef.setInput('primaryDatabaseLogicalSizeEstimate', databaseSize);
    fixture.componentRef.setInput('targetCopyOperationSize', operationSize);
    fixture.componentRef.setInput('replicator', { ...replicator });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartitionReplicationModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ReplicaBuildProgressComponent);
    component = fixture.componentInstance;
    providerDetail = { Kind: 'ESE', CopyType: 1, CopyMode: 2 };
    buildStatus = {
      InbuildPhase: 'Copy',
      CopyContextPhase: 'GetCopyContext',
      LastCopySequenceNumber: '100000',
      LastCopyCatchupSequenceNumber: '150000',
      CopyContextPhaseStartTimeUtc: '2026-09-15T10:00:00.000Z',
      CopyStatePhaseStartTimeUtc: '2026-09-15T10:00:05.000Z',
      CopyPhaseStartTimeUtc: '2026-09-15T10:00:12.000Z',
      CopyCatchupPhaseStartTimeUtc: '0001-01-01T00:00:00.000Z',
      CopyDetails: { Kind: 'KeyValueStore', ProviderCopyDetail: providerDetail }
    };
    replicator = {
      ReplicaId: '132431356665040624',
      IsInBuild: true,
      LastAcknowledgementProcessedTimeUtc: '2026-09-15T10:01:00.000Z',
      LastReceivedReplicationSequenceNumber: '125000',
      LastAppliedReplicationSequenceNumber: '120000',
      LastReceivedCopySequenceNumber: '700',
      LastAppliedCopySequenceNumber: '640',
      RemoteReplicatorAcknowledgementStatus: {
        ReplicationStreamAcknowledgementDetail: {
          AverageReceiveDuration: '0',
          AverageApplyDuration: '0',
          NotReceivedCount: '0',
          ReceivedAndNotAppliedCount: '0'
        },
        CopyStreamAcknowledgementDetail: {
          AverageReceiveDuration: '0',
          AverageApplyDuration: '0',
          NotReceivedCount: '0',
          ReceivedAndNotAppliedCount: '0'
        }
      },
      RemoteInbuildReplicaStatus: buildStatus
    };
    databaseSize = String(5 * 1024 ** 3);
    operationSize = 2 * 1024 * 1024;
    fixture.componentRef.setInput('isEseBackedKvs', true);
  });

  it('renders the applied copy CSN, not the received copy cursor or replication LSN', () => {
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current CSN: 640');
    expect(currentSequenceInfo().attributes['aria-label']).toBe('Applied copy-stream sequence number (CSN); not a replication LSN.');
    expect(currentSequenceInfo().attributes.tabindex).toBe('0');
    expect(currentSequence().attributes.title).toBeUndefined();
    expect(copyFill().styles.width).toBe('25%');
    expect(description().nativeElement.textContent).toBe('Estimated Copy Progress: 25%');
  });

  it('switches to the applied replication LSN at catchup and keeps Copy complete on refresh', () => {
    render();
    buildStatus.InbuildPhase = 'CopyCatchup';
    buildStatus.CopyCatchupPhaseStartTimeUtc = '2026-09-15T10:02:00.000Z';
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current LSN: 120000');
    expect(currentSequenceInfo().attributes['aria-label']).toBe('Applied replication LSN; advances only when replication operations are applied.');
    expect(copyFill().styles.width).toBe('100%');
    expect(fixture.debugElement.queryAll(By.css('.lsn-bar-track .lsn-bar-fill'))[1].styles.width).toBe('40%');
    expect(fixture.debugElement.query(By.css('[data-cy=copy-estimate-info]'))).toBeNull();

    replicator.LastAppliedCopySequenceNumber = '800';
    replicator.LastAppliedReplicationSequenceNumber = '125000';
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current LSN: 125000');
    expect(copyFill().styles.width).toBe('100%');
    expect(fixture.debugElement.queryAll(By.css('.lsn-bar-track .lsn-bar-fill'))[1].styles.width).toBe('50%');
  });

  it.each(['CopyContext', 'CopyState'])('explains that the current sequence is unavailable during %s', phase => {
    buildStatus.InbuildPhase = phase;
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current LSN: \u2014');
    expect(component.hasCurrentLsn).toBe(false);
    expect(currentSequenceInfo().attributes['aria-label']).toBe(
      'Not available until Copy starts. Shows the applied copy-stream sequence number (CSN) during Copy, then the applied replication LSN during CopyCatchup.');
    expect(currentSequenceInfo().attributes.tabindex).toBe('0');
    expect(currentSequence().attributes.title).toBeUndefined();
  });

  it.each([
    { name: 'partial logical copy', copyType: 2, copyMode: 2, eseBacked: true },
    { name: 'physical full copy', copyType: 1, copyMode: 1, eseBacked: true },
    { name: 'partial physical copy', copyType: 2, copyMode: 1, eseBacked: true },
    { name: 'unknown copy type', copyType: 0, copyMode: 2, eseBacked: true },
    { name: 'non-ESE partition', copyType: 1, copyMode: 2, eseBacked: false }
  ])('updates CSN without estimating progress for $name', ({ copyType, copyMode, eseBacked }) => {
    providerDetail.CopyType = copyType;
    providerDetail.CopyMode = copyMode;
    fixture.componentRef.setInput('isEseBackedKvs', eseBacked);
    render();

    expect(component.estimatedCopyPercent).toBeUndefined();
    expect(copyFill().classes['lsn-bar-indeterminate']).toBe(true);
    expect(description().nativeElement.textContent).toBe('Copy stream in progress; percentage unavailable.');
    expect(currentSequence().nativeElement.textContent).toBe('Current CSN: 640');
    expect(fixture.debugElement.query(By.css('[data-cy=copy-estimate-info]'))).toBeNull();

    replicator.LastReceivedCopySequenceNumber = '1400';
    replicator.LastAppliedCopySequenceNumber = '1280';
    replicator.LastAppliedReplicationSequenceNumber = '130000';
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current CSN: 1280');
    expect(component.estimatedCopyPercent).toBeUndefined();
    expect(copyFill().classes['lsn-bar-indeterminate']).toBe(true);
    expect(description().nativeElement.textContent).toBe('Copy stream in progress; percentage unavailable.');
    expect(fixture.debugElement.query(By.css('[data-cy=copy-estimate-info]'))).toBeNull();
  });

  it.each([
    { cursor: '0', percent: 0 },
    { cursor: '2560', percent: 99 },
    { cursor: '3000', percent: 99 }
  ])('shows $percent% for CSN $cursor without completing Copy early', ({ cursor, percent }) => {
    replicator.LastAppliedCopySequenceNumber = cursor;
    render();

    expect(copyFill().styles.width).toBe(`${percent}%`);
    expect(description().nativeElement.textContent).toBe(`Estimated Copy Progress: ${percent}%`);
    expect(copyFill().classes['lsn-bar-indeterminate']).not.toBe(true);
  });

  it('uses the configured operation size and discloses its source', () => {
    operationSize = 4 * 1024 * 1024;
    render();

    expect(copyFill().styles.width).toBe('50%');
    expect(description().nativeElement.textContent).toBe('Estimated Copy Progress: 50%');
    expect(fixture.debugElement.query(By.css('[data-cy=copy-estimate-info]')).attributes['aria-label'])
      .toContain('4194304 bytes per copy operation (cluster manifest ReplicatedStore/TargetCopyOperationSize)');
    expect(component.estimatedCopyInfo).toContain('runtime may reduce the target');
  });

  it('discloses when the native default is used', () => {
    fixture.componentRef.setInput('isDefaultCopyOperationSize', true);
    render();

    expect(component.estimatedCopyInfo).toContain('2097152 bytes per copy operation (native default; setting absent from cluster manifest)');
  });

  it.each([undefined, 0, -1, 1.5, NaN, Infinity, 2147483648])('does not estimate for invalid operation size %s', size => {
    operationSize = size;
    render();

    expect(component.estimatedCopyPercent).toBeUndefined();
    expect(copyFill().classes['lsn-bar-indeterminate']).toBe(true);
    expect(description().nativeElement.textContent).toContain('TargetCopyOperationSize is unavailable or invalid');
    expect(fixture.debugElement.query(By.css('[data-cy=copy-estimate-info]'))).toBeNull();
  });

  it('waits for a valid operation size without freezing the database size prematurely', () => {
    operationSize = undefined;
    render();

    operationSize = 4 * 1024 * 1024;
    databaseSize = String(10 * 1024 ** 3);
    render();

    expect(copyFill().styles.width).toBe('25%');
  });

  it('freezes database and operation sizes within a build and resets them for the next build', () => {
    fixture.componentRef.setInput('isDefaultCopyOperationSize', true);
    render();
    expect(component.estimatedCopyPercent).toBe(25);

    databaseSize = String(10 * 1024 ** 3);
    operationSize = 1024 * 1024;
    fixture.componentRef.setInput('isDefaultCopyOperationSize', false);
    replicator.LastAppliedCopySequenceNumber = '1280';
    render();
    expect(copyFill().styles.width).toBe('50%');
    expect(component.estimatedCopyInfo).toContain('2097152 bytes per copy operation (native default');

    buildStatus.CopyContextPhaseStartTimeUtc = '2026-09-15T11:00:00.000Z';
    render();
    expect(copyFill().styles.width).toBe('12.5%');
    expect(component.estimatedCopyInfo).toContain('1048576 bytes per copy operation (cluster manifest');
  });

  it('clears stale cursors and progress when build status disappears', () => {
    render();
    replicator.RemoteInbuildReplicaStatus = undefined;
    render();

    expect(fixture.debugElement.query(By.css('[data-cy=build-progress]'))).toBeNull();
    expect(component.currentLsnLabel).toBe('');
    expect(component.currentSequenceInfo).toBe('');
    expect(component.hasCurrentLsn).toBe(false);
    expect(component.estimatedCopyPercent).toBeUndefined();
    expect(component.copyPhaseProgress).toBeUndefined();
    expect(component.catchupPhaseProgress).toBeUndefined();

    databaseSize = String(10 * 1024 ** 3);
    replicator.RemoteInbuildReplicaStatus = buildStatus;
    render();
    expect(currentSequence().nativeElement.textContent).toBe('Current CSN: 640');
    expect(copyFill().styles.width).toBe('12.5%');
  });
});
