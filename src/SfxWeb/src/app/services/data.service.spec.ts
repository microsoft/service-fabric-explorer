import { of } from 'rxjs';
import { NodeMessageThrottlingEventKinds } from '../Models/eventstore/Events';
import { DataService } from './data.service';

describe('DataService', () => {
  it('requests node throttling events across the EventStore retention window', async () => {
    let requestedNodeName: string | undefined;
    let requestedEventKinds: string[] = [];
    let requestedStart!: Date;
    let requestedEnd!: Date;
    const beforeRequest = new Date();
    const data = Object.create(DataService.prototype) as DataService;
    data.restClient = {
      getNodeEvents: (start: Date, end: Date, nodeName?: string, eventKinds: string[] = []) => {
        requestedStart = start;
        requestedEnd = end;
        requestedNodeName = nodeName;
        requestedEventKinds = eventKinds;
        return of([]);
      }
    } as any;

    const events = data.getNodeThrottlingEventList('node0', 30);
    await events.ensureInitialized().toPromise();
    const afterRequest = new Date();

    expect(requestedNodeName).toBe('node0');
    expect(requestedEventKinds).toEqual(NodeMessageThrottlingEventKinds);
    expect(requestedStart.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime() - (30 * 24 * 60 * 60 * 1000));
    expect(requestedStart.getTime()).toBeLessThanOrEqual(afterRequest.getTime() - (30 * 24 * 60 * 60 * 1000));
    expect(requestedEnd.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
    expect(requestedEnd.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
  });
});