import { NodeTimelineGenerator, EventStoreUtils, ApplicationTimelineGenerator } from './timelineGenerators';
import { ApplicationEvent, NodeEvent } from './Events';


describe('TimelineGenerators', () => {
    const nodeInstanceId = "132327707667996470";
    const startDate = new Date('2020-04-29T01:39:55Z');
    const endDate  = new Date('2020-05-06T01:39:55Z');

    const id = '29dd383d-fdd4-4499-8e69-b7b40de04bd2Node test_node down' + nodeInstanceId;
    const id2 = "29dd383d-fdd4-4499-8e69-b7b40de04bd3Node test_node down" + nodeInstanceId;
    const groupId = 'Node Down';
    describe('Node generator', () => {
        const generator = new NodeTimelineGenerator();
        const nodeDownGroups = {id: NodeTimelineGenerator.NodesDownLabel, content: NodeTimelineGenerator.NodesDownLabel, subgroupStack: {stack: true}};

        const downEvent = new NodeEvent();

        const lastNodeUpAt = '2020-05-01T01:39:55Z';
        downEvent.fillFromJSON({
            Kind: 'NodeDown',
            NodeInstance: nodeInstanceId,
            LastNodeUpAt: lastNodeUpAt,
            NodeName: 'test_node',
            EventInstanceId: '29dd383d-fdd4-4499-8e69-b7b40de04bd2',
            TimeStamp: '2020-05-09T16:46:39.2458955Z',
            Category: 'StateTransition',
            HasCorrelatedEvents: false
          });

        const upEvent = new NodeEvent();
        upEvent.fillFromJSON({
              Kind: 'NodeUp',
              NodeInstance: nodeInstanceId,
              LastNodeDownAt: '2020-05-01T01:39:55Z',
              NodeName: 'test_node',
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
                content: 'Node test_node down',
                start: '2020-05-01T01:39:55Z',
                end: '2020-05-09T17:46:39.2458955Z',
                kind: upEvent.kind,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(upEvent.eventProperties, '2020-05-01T01:39:55Z', '2020-05-09T17:46:39.2458955Z', 'Node test_node down'),
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
                content: 'Node test_node down',
                start: downEvent.timeStamp,
                end: endDate.toISOString(),
                kind: downEvent.kind,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, endDate.toISOString(), 'Node test_node down'),
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
                content: 'Node test_node down',
                start: downEvent.timeStamp,
                end: upEvent.timeStamp,
                kind: downEvent.kind,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, upEvent.timeStamp, 'Node test_node down'),
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
                content: 'Node test_node down',
                start: downEvent.timeStamp,
                end: upEvent.timeStamp,
                kind: downEvent.kind,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(downEvent.eventProperties, downEvent.timeStamp, upEvent.timeStamp, 'Node test_node down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.items.get(instanceId + 'Node test_node down' + nodeInstanceId)).toEqual({
                id: instanceId + 'Node test_node down' + nodeInstanceId,
                content: 'Node test_node down',
                start: lastNodeUpAt2,
                end: timeStamp,
                kind: upEvent.kind,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(secondUpEvent.eventProperties, lastNodeUpAt2, timeStamp, 'Node test_node down'),
                className: 'red',
                subgroup: 'stack'
            });

            expect(events.groups.length).toBe(1);
            expect(events.groups.get(groupId)).toEqual(nodeDownGroups);

            expect(events.potentiallyMissingEvents).toBeFalsy();

        });

        fit('node deactivation', () => {
            const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

            const deactivate = new NodeEvent();
            deactivate.fillFromJSON(        {
                Kind: 'NodeDeactivateCompleted',
                NodeInstance: "132473586821247630",
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
                NodeInstance: "132473586821247630",
                LastNodeUpAt: '2020-10-16T21:51:31Z',
                NodeName: '_node4_3',
                EventInstanceId: 'b1c23829-3d71-499d-b82e-b3ac89447399',
                TimeStamp: '2020-10-17T01:42:11.3342981Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            const data = [deactivate, down];

            const events = generator.consume(data, startDate, endDateRange);
            expect(events.items.length).toBe(1);
            expect(events.potentiallyMissingEvents).toBeFalse();
        });

        fit('Node open failed', () => {
          const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

          const openFailed = new NodeEvent();
          openFailed.fillFromJSON({
            "NodeInstance": 132953395232923420,
            "NodeId": "662f079db4749ff3fce36b95782613cd",
            "UpgradeDomain": "3",
            "FaultDomain": "fd:/3",
            "IpAddressOrFQDN": "10.0.0.7",
            "Hostname": "nodet000003",
            "IsSeedNode": true,
            "NodeVersion": "8.2.1571.9590:44",
            "Error": "MessageExpired",
            "NodeName": "_nodet_3",
            "Kind": "NodeOpenFailed",
            "EventInstanceId": "3e807d9b-65f8-4107-8448-f9ba8ef5dc2b",
            "TimeStamp": "2022-04-25T06:22:41.5813324Z",
            "Category": "StateTransition",
            "HasCorrelatedEvents": false
        });

          const data = [openFailed];

          const events = generator.consume(data, startDate, endDateRange);
          expect(events.items.length).toBe(1);
          expect(events.groups.length).toBe(2);
        });


      fit('Node added to cluster', () => {
        const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

        const addedToClusterEvent = new NodeEvent();
        addedToClusterEvent.fillFromJSON({
          "NodeId": "8cb211aaca75a57f62d446b4ca83c94",
          "NodeInstance": 132977667372604290,
          "NodeType": "AM2003",
          "FabricVersion": "9.0.1017.9590:5:132977600431854285",
          "IpAddressOrFQDN": "10.0.76.12",
          "NodeCapacities": "(servicefabric:/_CpuCores:3 servicefabric:/_MemoryInMB:11468)",
          "NodeName": "AM2003_16",
          "Kind": "NodeAddedToCluster",
          "EventInstanceId": "e24538e6-8d44-41a2-a4b9-ae518c68761e",
          "TimeStamp": "2022-05-23T08:05:46.1278706Z",
          "Category": "StateTransition",
          "HasCorrelatedEvents": false
        });

        const nodeUpevent = new NodeEvent();
        nodeUpevent.fillFromJSON({
          "NodeInstance": 132977667372604290,
          "LastNodeDownAt": "1601-01-01T00:00:00Z",
          "NodeName": "AM2003_16",
          "Kind": "NodeUp",
          "EventInstanceId": "35548e05-5c77-46e6-b499-13e59e97af64",
          "TimeStamp": "2022-05-23T08:05:46.1278888Z",
          "Category": "StateTransition",
          "HasCorrelatedEvents": false
        });

        const nodeDownEvent = new NodeEvent();
        nodeDownEvent.fillFromJSON({
          "NodeInstance": 132977667372604290,
          "LastNodeUpAt": "2022-05-23T08:05:46Z",
          "NodeName": "AM2003_16",
          "Kind": "NodeDown",
          "EventInstanceId": "0ae08509-f98a-4efd-9698-84daf99cfbe5",
          "TimeStamp": "2022-05-23T08:07:18.2705931Z",
          "Category": "StateTransition",
          "HasCorrelatedEvents": false
        })

        const nodeUpevent2 = new NodeEvent();
        nodeUpevent2.fillFromJSON({
          "NodeInstance": 132977672576275360,
          "LastNodeDownAt": "2022-05-23T08:07:18Z",
          "NodeName": "AM2003_16",
          "Kind": "NodeUp",
          "EventInstanceId": "334ea603-df68-4973-be67-9e5c2f51e68e",
          "TimeStamp": "2022-05-23T08:14:31.7394639Z",
          "Category": "StateTransition",
          "HasCorrelatedEvents": false
        });


        const data = [addedToClusterEvent, nodeUpevent, nodeDownEvent, nodeUpevent2];

        const events = generator.consume(data, startDate, endDateRange);
        expect(events.items.length).toBe(2);
        expect(events.groups.length).toBe(2);
      });

        fit('Node  down and removed from cluster', () => {
            const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

            const nodeDownEvent = new NodeEvent();
            nodeDownEvent.fillFromJSON({
              "NodeInstance": nodeInstanceId,
              "LastNodeUpAt": "2022-04-25T06:22:31.5813324Z",
              "NodeName": "test_node",
              "Kind": "NodeDown",
              "EventInstanceId": '29dd383d-fdd4-4499-8e69-b7b40de04bd3',
              "TimeStamp": "2022-04-25T06:22:35.5813324Z",
              "Category": "StateTransition",
              "HasCorrelatedEvents": false
            })

            const removed = new NodeEvent();
            removed.fillFromJSON({
            "NodeId": "c39386718b3d77d766d8bc458d52dad",
            "NodeInstance": nodeInstanceId,
            "NodeType": "grnit-mtsvc-prod-emea03-comm-euwe-s1-vm",
            "FabricVersion": "8.2.1571.9590:23:132641081419555438",
            "IpAddressOrFQDN": "10.2.0.19",
            "NodeCapacities": "(servicefabric:/_CpuCores:6 servicefabric:/_MemoryInMB:26213)",
            "NodeName": "test_node",
            "Kind": "NodeRemovedFromCluster",
            "EventInstanceId": "581c886b-a29f-48d3-b313-225b4c42d025",
            "TimeStamp": "2022-04-25T06:22:41.5813324Z",
            "Category": "StateTransition",
            "HasCorrelatedEvents": false
        },);


            const data = [nodeDownEvent, removed];

            const events = generator.consume(data, startDate, endDateRange);
            const content = "Node test_node down and removed from the cluster";
            const itemId = "29dd383d-fdd4-4499-8e69-b7b40de04bd3" + content + nodeInstanceId;

            expect(events.items.length).toBe(2);
            expect(events.groups.length).toBe(2);
            expect(events.items.get(itemId)).toEqual({
              id: itemId,
              content,
              start: '2022-04-25T06:22:35.5813324Z',
              end: '2022-04-25T06:22:41.5813324Z',
              kind: downEvent.kind,
              group: NodeTimelineGenerator.NodesDownLabel,
              type: 'range',
              title: EventStoreUtils.tooltipFormat(nodeDownEvent.eventProperties, '2022-04-25T06:22:35.5813324Z', '2022-04-25T06:22:41.5813324Z', content),
              className: 'darkorange',
              subgroup: 'stack'
          });
          });
    });

    describe('Application', () => {

      const generator = new ApplicationTimelineGenerator();

      fit('container exit', () => {
        const endDateRange = new Date('2020-10-17T05:41:22.8992645Z');

        const containerExitEvent = new ApplicationEvent();
        containerExitEvent.fillFromJSON({
            "ServiceName": "fabric:/test",
            "ServicePackageName": "test.HostPkg",
            "ServicePackageActivationId": "b8505a1e-ac6f-43be-a76a-bc4652c98975",
            "IsExclusive": true,
            "CodePackageName": "Code",
            "EntryPointType": "ContainerHost",
            "ImageName": "somecontainer.net/image",
            "ContainerName": "b8505a1e-ac6f-43be-a76a-bc4652c98975",
            "HostId": "ffa6bc13-b8a2-44e8-8a00-fe707c9b63d7",
            "ExitCode": 7147,
            "UnexpectedTermination": false,
            "StartTime": "2022-05-18T16:42:13Z",
            "ExitReason": "The process/container terminated with exit code:7147. Restarting the container because HEALTHCHECK for Docker container ContainerName=-a76a-bc4652c98975, reported health_status=unhealthy, TimeStamp=2022-05-23 12:43:48.000.. For information about common termination errors, please visit https://aka.ms/service-fabric-termination-errors",
            "ApplicationId": "testapp",
            "Kind": "ApplicationContainerInstanceExited",
            "EventInstanceId": "0dbbfb66-5e0c-40f0-af6b-249ffb4d5770",
            "TimeStamp": "2022-05-23T12:44:30.929434Z",
            "Category": "StateTransition",
            "HasCorrelatedEvents": false
        })

        const data = [containerExitEvent];
        const events = generator.consume(data, startDate, endDateRange);
        expect(events.items.length).toBe(1);
        expect(events.potentiallyMissingEvents).toBeFalse();
    });
    })
  describe('Application generator', () => {
    const generator = new ApplicationTimelineGenerator();

    fit('application upgrade', () => {
      const startUpgrade = new ApplicationEvent();
      const EventInstanceId = "89cfb53c-a003-43e6-9899-de7603fbc972";
      startUpgrade.fillFromJSON({
        "ApplicationTypeName": "VisualObjectsApplicationType",
        "CurrentApplicationTypeVersion": "23.0.0",
        "ApplicationTypeVersion": "25.0.0",
        "UpgradeType": "Rolling",
        "RollingUpgradeMode": "UnmonitoredAuto",
        "FailureAction": "Manual",
        "ApplicationId": "VisualObjects",
        "Kind": "ApplicationUpgradeStarted",
        "EventInstanceId": EventInstanceId,
        "TimeStamp": "2022-06-02T16:49:58.656Z",
        "Category": "Upgrade",
        "HasCorrelatedEvents": false
      });

      const end = new ApplicationEvent();
      end.fillFromJSON({
        "ApplicationTypeName": "VisualObjectsApplicationType",
        "ApplicationTypeVersion": "25.0.0",
        "OverallUpgradeElapsedTimeInMs": 117017.3601,
        "ApplicationId": "VisualObjects",
        "Kind": "ApplicationUpgradeCompleted",
        "EventInstanceId": EventInstanceId,
        "TimeStamp": "2022-06-02T16:51:55.6741761Z",
        "Category": "Upgrade",
        "HasCorrelatedEvents": false
      });


      const data = [end, startUpgrade];
      const events = generator.consume(data, startDate, endDate);
      events.items.forEach(item => console.log(item))
      const content = "Upgrade rolling forward to 25.0.0";

      expect(events.items.length).toBe(1);
      expect(events.items.get(EventInstanceId + content)).toEqual({
        "id":  EventInstanceId + content,
        content,
        "start": "2022-06-02T16:49:58.656Z",
        "end": "2022-06-02T16:51:55.6741761Z",
        "group": "Application Upgrades",
        "type": "range",
        title: EventStoreUtils.tooltipFormat(end.eventProperties, startUpgrade.timeStamp, end.timeStamp),
        "className": "green"
      });

      expect(events.groups.length).toBe(4);
      expect(events.potentiallyMissingEvents).toBeFalsy();
    });
  });
})
