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

  const copyFill = () => fixture.debugElement.query(By.css('.lsn-bar-track .lsn-bar-fill'));
  const currentSequence = () => fixture.debugElement.query(By.css('[data-cy=current-lsn]'));
  const description = () => fixture.debugElement.query(By.css('[data-cy=copy-progress-description]'));
  const render = () => {
    fixture.componentRef.setInput('primaryDatabaseLogicalSizeEstimate', databaseSize);
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
    fixture.componentRef.setInput('isEseBackedKvs', true);
  });

  it('renders the applied copy CSN, not the received copy cursor or replication LSN', () => {
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current CSN: 640');
    expect(currentSequence().attributes.title).toBe('Applied copy-stream sequence number (CSN); not a replication LSN.');
    expect(copyFill().styles.width).toBe('25%');
    expect(description().nativeElement.textContent).toBe('Estimated Copy Progress: 25%');
  });

  it('switches to the applied replication LSN at catchup and keeps Copy complete on refresh', () => {
    render();
    buildStatus.InbuildPhase = 'CopyCatchup';
    buildStatus.CopyCatchupPhaseStartTimeUtc = '2026-09-15T10:02:00.000Z';
    render();

    expect(currentSequence().nativeElement.textContent).toBe('Current LSN: 120000');
    expect(currentSequence().attributes.title).toBe('Applied replication LSN; advances only when replication operations are applied.');
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

  it('freezes the database size within a build and resets it for the next build', () => {
    render();
    expect(component.estimatedCopyPercent).toBe(25);

    databaseSize = String(10 * 1024 ** 3);
    replicator.LastAppliedCopySequenceNumber = '1280';
    render();
    expect(copyFill().styles.width).toBe('50%');

    buildStatus.CopyContextPhaseStartTimeUtc = '2026-09-15T11:00:00.000Z';
    render();
    expect(copyFill().styles.width).toBe('25%');
  });

  it('clears stale cursors and progress when build status disappears', () => {
    render();
    replicator.RemoteInbuildReplicaStatus = undefined;
    render();

    expect(fixture.debugElement.query(By.css('[data-cy=build-progress]'))).toBeNull();
    expect(component.currentLsnLabel).toBe('');
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
