import { ITimedReplication } from './replica-status-container/replica-status-container.component';
import { generateReplicationDeltas } from './replication-utils';

describe('ReplicationTrendLineComponent', () => {
  fit('should create', () => {
    const items = [
      {
        date: new Date('2020-02-14T05:28:50.161Z'),
        LastAppliedReplicationSequenceNumber: '100',
      },
      {
        date: new Date('2020-02-14T05:28:51.161Z'),
        LastAppliedReplicationSequenceNumber: '110',
      },
      {
        date: new Date('2020-02-14T05:28:52.161Z'),
        LastAppliedReplicationSequenceNumber: '140',
      },
      {
        date: new Date('2020-02-14T05:28:54.161Z'),
        LastAppliedReplicationSequenceNumber: '200',
      },
    ] as ITimedReplication[];

    const deltas = generateReplicationDeltas(items);

    expect(deltas[0].delta).toBe(10);
    expect(deltas[1].delta).toBe(30);
    expect(deltas[2].delta).toBe(30);
    expect(deltas.length).toBe(3);
  });
});
