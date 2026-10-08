import { NodeEvent } from './Events';

export const FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND = 'FabricProcessResourceUsage';
export const FABRIC_PROCESS_RESOURCE_USAGE_MIN_FRESHNESS_MS = 15 * 60 * 1000;
export const FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS = 90 * 60 * 1000;

export interface IFabricProcessResourceUsageSample {
  cpuPercent: number;
  memoryPercent: number;
  memoryRssBytes: number;
  memoryTotalBytes: number;
  sampleDurationMs: number;
  timestamp: Date;
}

export interface IFabricProcessResourceUsageNodeSeries {
  nodeName: string;
  samples: IFabricProcessResourceUsageSample[];
}

export type FabricProcessResourceUsageMetric = 'cpuPercent' | 'memoryPercent';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isFabricProcessResourceUsageSampleCurrent(
  sample: IFabricProcessResourceUsageSample,
  referenceTime: Date
): boolean {
  const ageMs = referenceTime.getTime() - sample.timestamp.getTime();
  const maxAgeMs = Math.min(
    FABRIC_PROCESS_RESOURCE_USAGE_LOOKBACK_MS,
    Math.max(FABRIC_PROCESS_RESOURCE_USAGE_MIN_FRESHNESS_MS, sample.sampleDurationMs * 3)
  );

  return ageMs >= -5 * 60 * 1000 && ageMs <= maxAgeMs;
}

export function parseFabricProcessResourceUsageEvent(
  event: NodeEvent,
  expectedNodeName?: string
): IFabricProcessResourceUsageSample | undefined {
  const cpuPercent = event.raw.CpuUsagePercent;
  const memoryRssBytes = event.raw.MemoryRssBytes;
  const memoryTotalBytes = event.raw.MemoryTotalBytes;
  const sampleDurationMs = event.raw.SampleDurationMs;
  const timestamp = event.time;

  if (event.kind !== FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND
    || typeof event.nodeName !== 'string'
    || event.nodeName.trim().length === 0
    || (expectedNodeName !== undefined && event.nodeName !== expectedNodeName)
    || !(timestamp instanceof Date)
    || !Number.isFinite(timestamp.getTime())
    || !isFiniteNumber(cpuPercent)
    || cpuPercent < 0
    || cpuPercent > 100
    || !isFiniteNumber(memoryRssBytes)
    || memoryRssBytes < 0
    || !isFiniteNumber(memoryTotalBytes)
    || memoryTotalBytes <= 0
    || memoryRssBytes > memoryTotalBytes
    || !isFiniteNumber(sampleDurationMs)
    || sampleDurationMs <= 0) {
    return undefined;
  }

  return {
    cpuPercent,
    memoryPercent: memoryRssBytes / memoryTotalBytes * 100,
    memoryRssBytes,
    memoryTotalBytes,
    sampleDurationMs,
    timestamp
  };
}

export function getLatestFabricProcessResourceUsageByNode(
  events: NodeEvent[],
  startDate: Date,
  endDate: Date
): Map<string, IFabricProcessResourceUsageSample> {
  const latestByNode = new Map<string, IFabricProcessResourceUsageSample>();

  events.forEach(event => {
    if (typeof event.nodeName !== 'string' || event.nodeName.trim().length === 0) {
      return;
    }

    const sample = parseFabricProcessResourceUsageEvent(event, event.nodeName);
    if (!sample || sample.timestamp < startDate || sample.timestamp > endDate) {
      return;
    }

    const current = latestByNode.get(event.nodeName);
    if (!current || sample.timestamp > current.timestamp) {
      latestByNode.set(event.nodeName, sample);
    }
  });

  return latestByNode;
}

export function getFabricProcessResourceUsageSeriesByNode(
  events: NodeEvent[],
  startDate: Date,
  endDate: Date
): IFabricProcessResourceUsageNodeSeries[] {
  const samplesByNode = new Map<string, IFabricProcessResourceUsageSample[]>();

  events.forEach(event => {
    if (typeof event.nodeName !== 'string' || event.nodeName.trim().length === 0) {
      return;
    }

    const sample = parseFabricProcessResourceUsageEvent(event, event.nodeName);
    if (!sample || sample.timestamp < startDate || sample.timestamp > endDate) {
      return;
    }

    const samples = samplesByNode.get(event.nodeName) ?? [];
    samples.push(sample);
    samplesByNode.set(event.nodeName, samples);
  });

  return Array.from(samplesByNode, ([nodeName, samples]) => ({
    nodeName,
    samples: samples.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime())
  }));
}

export function getTopFabricProcessResourceUsageNodeSeries(
  series: IFabricProcessResourceUsageNodeSeries[],
  metric: FabricProcessResourceUsageMetric,
  limit: number
): IFabricProcessResourceUsageNodeSeries[] {
  return [...series]
    .sort((left, right) => {
      const rightPeak = Math.max(...right.samples.map(sample => sample[metric]));
      const leftPeak = Math.max(...left.samples.map(sample => sample[metric]));
      return rightPeak - leftPeak || left.nodeName.localeCompare(right.nodeName);
    })
    .slice(0, limit);
}

export function formatFabricProcessResourceBytes(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}