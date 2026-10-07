import { NodeEvent } from './Events';
import { formatFabricProcessResourceBytes, getFabricProcessResourceUsageSeriesByNode, getLatestFabricProcessResourceUsageByNode, getTopFabricProcessResourceUsageNodeSeries, isFabricProcessResourceUsageSampleCurrent, parseFabricProcessResourceUsageEvent } from './FabricProcessResourceUsage';

function createEvent(overrides: Record<string, unknown> = {}): NodeEvent {
  const event = new NodeEvent();
  event.fillFromJSON({
    Kind: 'FabricProcessResourceUsage',
    NodeName: '_nt_0',
    CpuUsagePercent: 25,
    MemoryRssBytes: 2_000,
    MemoryTotalBytes: 8_000,
    SampleDurationMs: 300_000,
    TimeStamp: '2026-09-04T20:26:45Z',
    EventInstanceId: '00000000-0000-0000-0000-000000000001',
    ...overrides
  });
  return event;
}

describe('parseFabricProcessResourceUsageEvent', () => {
  it('converts a valid event to a resource sample', () => {
    const sample = parseFabricProcessResourceUsageEvent(createEvent(), '_nt_0');

    expect(sample).toEqual({
      cpuPercent: 25,
      memoryPercent: 25,
      memoryRssBytes: 2_000,
      memoryTotalBytes: 8_000,
      sampleDurationMs: 300_000,
      timestamp: new Date('2026-09-04T20:26:45Z')
    });
  });

  it('rejects malformed resource values', () => {
    expect(parseFabricProcessResourceUsageEvent(createEvent({ CpuUsagePercent: 'invalid' }))).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ CpuUsagePercent: 101 }))).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ MemoryRssBytes: 9_000 }))).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ MemoryTotalBytes: 0 }))).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ SampleDurationMs: 0 }))).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ TimeStamp: 'not-a-date' }))).toBeUndefined();
  });

  it.each([
    'CpuUsagePercent',
    'MemoryRssBytes',
    'MemoryTotalBytes',
    'SampleDurationMs'
  ])('rejects non-numeric representations for %s', propertyName => {
    [
      null,
      true,
      false,
      '',
      ' ',
      '25',
      [],
      [25],
      {},
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY
    ].forEach(value => {
      expect(parseFabricProcessResourceUsageEvent(createEvent({ [propertyName]: value }))).toBeUndefined();
    });
  });

  it('rejects events for a different node or kind', () => {
    expect(parseFabricProcessResourceUsageEvent(createEvent({ NodeName: '_nt_1' }), '_nt_0')).toBeUndefined();
    expect(parseFabricProcessResourceUsageEvent(createEvent({ Kind: 'NodeUp' }), '_nt_0')).toBeUndefined();
  });

  it('selects the newest valid sample per node within the requested range', () => {
    const startDate = new Date('2026-09-04T20:00:00Z');
    const endDate = new Date('2026-09-04T21:00:00Z');
    const latestByNode = getLatestFabricProcessResourceUsageByNode([
      createEvent({ TimeStamp: '2026-09-04T20:10:00Z', CpuUsagePercent: 10 }),
      createEvent({ TimeStamp: '2026-09-04T20:50:00Z', CpuUsagePercent: 50 }),
      createEvent({ NodeName: '_nt_1', TimeStamp: '2026-09-04T20:30:00Z', CpuUsagePercent: 30 }),
      createEvent({ NodeName: '_nt_2', TimeStamp: '2026-09-04T19:59:59Z' }),
      createEvent({ NodeName: '_nt_3', TimeStamp: '2026-09-04T20:40:00Z', MemoryTotalBytes: 0 })
    ], startDate, endDate);

    expect(Array.from(latestByNode.keys()).sort()).toEqual(['_nt_0', '_nt_1']);
    expect(latestByNode.get('_nt_0')!.cpuPercent).toBe(50);
    expect(latestByNode.get('_nt_1')!.cpuPercent).toBe(30);
  });

  it('groups prototype-like node names as ordinary keys', () => {
    const startDate = new Date('2026-09-04T20:00:00Z');
    const endDate = new Date('2026-09-04T21:00:00Z');
    const events = [
      createEvent({ NodeName: 'constructor', CpuUsagePercent: 10 }),
      createEvent({ NodeName: '__proto__', CpuUsagePercent: 20 })
    ];

    const latestByNode = getLatestFabricProcessResourceUsageByNode(events, startDate, endDate);
    const series = getFabricProcessResourceUsageSeriesByNode(events, startDate, endDate);

    expect(latestByNode.get('constructor')!.cpuPercent).toBe(10);
    expect(latestByNode.get('__proto__')!.cpuPercent).toBe(20);
    expect(series.map(item => item.nodeName)).toEqual(['constructor', '__proto__']);
  });

  it('formats resource memory using decimal units', () => {
    expect(formatFabricProcessResourceBytes(0)).toBe('0 B');
    expect(formatFabricProcessResourceBytes(536_870_912)).toBe('536.9 MB');
  });

  it('uses the measured sample duration when determining freshness', () => {
    const referenceTime = new Date('2026-09-04T21:00:00Z');
    const defaultIntervalSample = parseFabricProcessResourceUsageEvent(createEvent({
      TimeStamp: '2026-09-04T20:44:00Z',
      SampleDurationMs: 5 * 60 * 1000
    }))!;
    const longIntervalSample = parseFabricProcessResourceUsageEvent(createEvent({
      TimeStamp: '2026-09-04T20:20:00Z',
      SampleDurationMs: 30 * 60 * 1000
    }))!;
    const boundedSample = parseFabricProcessResourceUsageEvent(createEvent({
      TimeStamp: '2026-09-04T19:29:59Z',
      SampleDurationMs: 24 * 60 * 60 * 1000
    }))!;

    expect(isFabricProcessResourceUsageSampleCurrent(defaultIntervalSample, referenceTime)).toBe(false);
    expect(isFabricProcessResourceUsageSampleCurrent(longIntervalSample, referenceTime)).toBe(true);
    expect(isFabricProcessResourceUsageSampleCurrent(boundedSample, referenceTime)).toBe(false);
  });

  it('groups chronological samples and ranks nodes by the selected peak metric', () => {
    const startDate = new Date('2026-09-04T20:00:00Z');
    const endDate = new Date('2026-09-04T21:00:00Z');
    const series = getFabricProcessResourceUsageSeriesByNode([
      createEvent({ NodeName: '_nt_0', TimeStamp: '2026-09-04T20:20:00Z', CpuUsagePercent: 20, MemoryRssBytes: 1_000 }),
      createEvent({ NodeName: '_nt_1', TimeStamp: '2026-09-04T20:30:00Z', CpuUsagePercent: 80, MemoryRssBytes: 2_000 }),
      createEvent({ NodeName: '_nt_0', TimeStamp: '2026-09-04T20:10:00Z', CpuUsagePercent: 40, MemoryRssBytes: 3_000 }),
      createEvent({ NodeName: '_nt_2', TimeStamp: '2026-09-04T20:40:00Z', CpuUsagePercent: 60, MemoryRssBytes: 4_000 })
    ], startDate, endDate);

    expect(series.find(item => item.nodeName === '_nt_0')!.samples.map(sample => sample.timestamp.toISOString())).toEqual([
      '2026-09-04T20:10:00.000Z',
      '2026-09-04T20:20:00.000Z'
    ]);
    expect(getTopFabricProcessResourceUsageNodeSeries(series, 'cpuPercent', 2).map(item => item.nodeName)).toEqual(['_nt_1', '_nt_2']);
    expect(getTopFabricProcessResourceUsageNodeSeries(series, 'memoryPercent', 2).map(item => item.nodeName)).toEqual(['_nt_2', '_nt_0']);
  });
});