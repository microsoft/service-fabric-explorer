import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { NodeThrottlingTimelineGenerator } from '../../eventstore/timelineGenerators';

describe('EventStore collections', () => {
  it('requests only node throttling events', async () => {
    let requestedNodeName: string | undefined;
    let requestedEventKinds: string[] = [];
    const data = Object.create(DataService.prototype) as DataService;
    data.restClient = {
      getNodeEvents: (_start: Date, _end: Date, nodeName?: string, eventKinds: string[] = []) => {
        requestedNodeName = nodeName;
        requestedEventKinds = eventKinds;
        return of([]);
      }
    } as any;

    const eventData = data.getNodeThrottlingEventData('node0');
    await eventData.eventsList.ensureInitialized().toPromise();

    expect(requestedNodeName).toBe('node0');
    expect(requestedEventKinds).toEqual(NodeThrottlingTimelineGenerator.eventKinds);
    expect(eventData.type).toBe('NodeThrottling');
    expect(eventData.displayName).toBe('Node Throttling');
  });
});
