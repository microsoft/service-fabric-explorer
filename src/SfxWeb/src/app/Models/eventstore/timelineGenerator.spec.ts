import { NodeTimelineGenerator, EventStoreUtils } from './timelineGenerators';
import { NodeEvent } from './Events';


describe('TimelineGenerators', () => {
    const startDate = new Date('2020-04-29T01:39:55Z');
    const endDate  = new Date('2020-05-06T01:39:55Z');

    const id = '29dd383d-fdd4-4499-8e69-b7b40de04bd2Node _dis-svc-test-BackEnd-vmss_2 down';
    const id2 = '29dd383d-fdd4-4499-8e69-b7b40de04bd3Node _dis-svc-test-BackEnd-vmss_2 down';
    const groupId = 'Node Down';
    describe('Node generator', () => {
        const generator = new NodeTimelineGenerator();
        const nodeDownGroups = {id: NodeTimelineGenerator.NodesDownLabel, content: NodeTimelineGenerator.NodesDownLabel, subgroupStack: {stack: true}};

        const downEvent = new NodeEvent();

        const lastNodeUpAt = '2020-05-01T01:39:55Z';
        downEvent.fillFromJSON({
            Kind: 'NodeDown',
            NodeInstance: 132327707667996470,
            LastNodeUpAt: lastNodeUpAt,
            NodeName: '_dis-svc-test-BackEnd-vmss_2',
            EventInstanceId: '29dd383d-fdd4-4499-8e69-b7b40de04bd2',
            TimeStamp: '2020-05-09T16:46:39.2458955Z',
            Category: 'StateTransition',
            HasCorrelatedEvents: false
          });

        const upEvent = new NodeEvent();
        upEvent.fillFromJSON({
              Kind: 'NodeUp',
              NodeInstance: 132327707667996470,
              LastNodeDownAt: '2020-05-01T01:39:55Z',
              NodeName: '_dis-svc-test-BackEnd-vmss_2',
              EventInstanceId: '29dd383d-fdd4-4499-8e69-b7b40de04bd3',
              TimeStamp: '2020-05-09T17:46:39.2458955Z',
              Category: 'StateTransition',
              HasCorrelatedEvents: false
            });


        fit('node started down and goes up', () => {
            const data = [upEvent];
            const events = generator.consume(data, startDate, endDate);

            expect(events.items.length).toBe(1);
            expect(events.items.get(id2)).toEqual({
                id: id2,
                content: 'Node _dis-svc-test-BackEnd-vmss_2 down',
                start: '2020-05-01T01:39:55Z',
                end: '2020-05-09T17:46:39.2458955Z',
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(upEvent.eventProperties, '2020-05-01T01:39:55Z', '2020-05-09T17:46:39.2458955Z', 'Node _dis-svc-test-BackEnd-vmss_2 down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();
        });

        fit('node started up and goes down', () => {
            const data = [downEvent];
            const events = generator.consume(data, startDate, endDate);

            expect(events.items.length).toBe(1);
            expect(events.items.get(id)).toEqual({
                id,
                content: 'Node _dis-svc-test-BackEnd-vmss_2 down',
                start: downEvent.timeStamp,
                end: endDate.toISOString(),
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, endDate.toISOString(), 'Node _dis-svc-test-BackEnd-vmss_2 down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();
        });

        fit('node goes down and up', () => {
            const data = [upEvent, downEvent];
            const events = generator.consume(data, startDate, endDate);

            expect(events.items.length).toBe(1);
            expect(events.items.get(id)).toEqual({
                id,
                content: 'Node _dis-svc-test-BackEnd-vmss_2 down',
                start: downEvent.timeStamp,
                end: upEvent.timeStamp,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, upEvent.timeStamp, 'Node _dis-svc-test-BackEnd-vmss_2 down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();

        });

        fit('node goes down (5 total events)', () => {
            const down1 = new NodeEvent();
            down1.fillFromJSON({...upEvent.raw, EventInstanceId: '1', NodeName: '1', NodeInstance: 1});
            const down2 = new NodeEvent();
            down2.fillFromJSON({...upEvent.raw, EventInstanceId: '2', NodeName: '2', NodeInstance: 2});
            const down3 = new NodeEvent();
            down3.fillFromJSON({...upEvent.raw, EventInstanceId: '3', NodeName: '3', NodeInstance: 3});
            const down4 = new NodeEvent();
            down4.fillFromJSON({...upEvent.raw, EventInstanceId: '4', NodeName: '4', NodeInstance: 4});
            const data = [downEvent, down1, down2, down3, down4];

            const events = generator.consume(data, startDate, endDate);
            expect(events.items.length).toBe(5);

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();

        });

        fit('node goes down, up, and down (2 total events)', () => {
            const secondUpEvent = new NodeEvent();

            const instanceId = 'test';
            const lastNodeUpAt2 = '2020-04-09T17:46:39.2458955Z';
            const timeStamp = '2020-05-01T16:46:39.2458955Z';

            const raw = {...upEvent.raw};
            raw.EventInstanceId = instanceId;
            raw.TimeStamp = timeStamp;
            raw.LastNodeDownAt = lastNodeUpAt2;

            secondUpEvent.fillFromJSON(raw);

            const data = [upEvent, downEvent, secondUpEvent];
            const events = generator.consume(data, startDate, endDate);
            expect(events.items.length).toBe(2);
            expect(events.items.get(id)).toEqual({
                id,
                content: 'Node _dis-svc-test-BackEnd-vmss_2 down',
                start: downEvent.timeStamp,
                end: upEvent.timeStamp,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, upEvent.timeStamp, 'Node _dis-svc-test-BackEnd-vmss_2 down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.items.get(instanceId + 'Node _dis-svc-test-BackEnd-vmss_2 down')).toEqual({
                id: instanceId + 'Node _dis-svc-test-BackEnd-vmss_2 down',
                content: 'Node _dis-svc-test-BackEnd-vmss_2 down',
                start: lastNodeUpAt2,
                end: timeStamp,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(secondUpEvent.eventProperties, lastNodeUpAt2, timeStamp, 'Node _dis-svc-test-BackEnd-vmss_2 down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();

        });

        fit('removed from cluster', () => {
            const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

            const deactivate = new NodeEvent();
            deactivate.fillFromJSON(        {
                Kind: 'NodeDeactivateCompleted',
                NodeInstance: 132473586821247630,
                EffectiveDeactivateIntent: 'RemoveNode',
                BatchIdsWithDeactivateIntent: '{[qwerqwerqwer:RemoveNode]',
                StartTime: '2020-10-16T21:26:23Z',
                NodeName: '_node4_3',
                EventInstanceId: '6bd7ba2a-3c0a-4699-acb6-6e139773de0d',
                TimeStamp: '2020-10-17T01:41:22.8992645Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            const down = new NodeEvent();
            down.fillFromJSON({
                Kind: 'NodeDown',
                NodeInstance: 132473586821247630,
                LastNodeUpAt: '2020-10-16T21:51:31Z',
                NodeName: '_node4_3',
                EventInstanceId: 'b1c23829-3d71-499d-b82e-b3ac89447399',
                TimeStamp: '2020-10-17T01:42:11.3342981Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            const data = [deactivate, down];

            const events = generator.consume(data, startDate, endDateRange);
            expect(events.items.length).toBe(2);
            expect(events.potentiallyMissingEvents).toBeFalse();
        });
    });
  });

