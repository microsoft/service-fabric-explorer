import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IRawNode } from '../../RawDataTypes';
import { NodeCollection } from './NodeCollection';
import { NodeEvent } from '../../eventstore/Events';

describe('NodeCollection', () => {
    const createNode = (name: string, upgradeDomain: string, nodeId = name, instanceId = '0', nodeUpAt = ''): IRawNode => ({
            Name: name,
            IpAddressOrFQDN: 'localhost',
            Type: 'nt',
            CodeVersion: '',
            ConfigVersion: '',
            NodeStatus: 'Up',
            NodeUpTimeInSeconds: '0',
            HealthState: 'Ok',
            IsSeedNode: false,
            UpgradeDomain: upgradeDomain,
            FaultDomain: 'fd:/0',
            Id: { Id: nodeId },
            InstanceId: instanceId,
            NodeDeactivationInfo: {
                NodeDeactivationIntent: 'Invalid',
                NodeDeactivationStatus: 'None',
                NodeDeactivationTask: [],
                PendingSafetyChecks: []
            },
            IsStopped: false,
            NodeDownTimeInSeconds: '0',
            NodeUpAt: nodeUpAt,
            NodeDownAt: '',
            NodeTags: []
        });

    const createEvent = (kind: string, nodeName: string, nodeId: string, nodeInstance: string | number, timeStamp: string) => {
        const event = new NodeEvent();
        event.fillFromJSON({
            Kind: kind,
            NodeName: nodeName,
            NodeId: nodeId,
            NodeInstance: nodeInstance,
            EventInstanceId: `${nodeName}-${kind}-${timeStamp}`,
            TimeStamp: timeStamp,
            Category: 'StateTransition',
            HasCorrelatedEvents: false
        });
        return event;
    };

    const createCollection = async (rawNodes: IRawNode[]) => {
        const data = {
            actionsEnabled: () => false,
            restClient: {
                getNodes: () => of(rawNodes)
            }
        } as DataService;
        const nodes = new NodeCollection(data);

        await nodes.ensureInitialized().toPromise();
        return nodes;
    };

    it('sorts Cluster Map upgrade domains numerically', async () => {
        const nodes = await createCollection([
                    createNode('node-10a', '10'),
                    createNode('node-0', '0'),
                    createNode('node-11', '11'),
                    createNode('node-2', '2'),
                    createNode('node-1', '1'),
                    createNode('node-10b', '10')
                ]);

        expect(nodes.upgradeDomains).toEqual(['0', '1', '2', '10', '11']);
    });

    it('tracks throttling only for the current node instance', async () => {
        const nodeId = '86fa6852ad467a903afbbc67edc16b66';
        const nodes = await createCollection([
            createNode('node0', '0', nodeId, '132327707667996470', '2020-05-01T02:00:00Z')
        ]);
        const staleStarted = createEvent(
            'NodeMessageThrottlingStarted', 'node0', nodeId, '132327707667996469', '2020-05-01T01:00:00Z');
        const currentStarted = createEvent(
            'NodeMessageThrottlingStarted', 'node0', nodeId, '132327707667996470', '2020-05-01T03:00:00Z');
        const currentEnded = createEvent(
            'NodeMessageThrottlingEnded', 'node0', nodeId, '132327707667996470', '2020-05-01T04:00:00Z');

        expect(nodes.isCurrentlyThrottling([staleStarted])).toBe(false);
        expect(nodes.isCurrentlyThrottling([currentStarted])).toBe(true);
        expect(nodes.isCurrentlyThrottling([currentStarted, currentEnded])).toBe(false);
    });

    it('uses node start time when EventStore cannot represent the instance id safely', async () => {
        const nodeId = '86fa6852ad467a903afbbc67edc16b66';
        const nodes = await createCollection([
            createNode('node0', '0', nodeId, '132327707667996470', '2020-05-01T02:00:00Z')
        ]);
        const staleStarted = createEvent(
            'NodeMessageThrottlingStarted', 'node0', nodeId, 132327707667996469, '2020-05-01T01:00:00Z');
        const currentStarted = createEvent(
            'NodeMessageThrottlingStarted', 'node0', nodeId, 132327707667996470, '2020-05-01T03:00:00Z');

        expect(nodes.isCurrentlyThrottling([staleStarted])).toBe(false);
        expect(nodes.isCurrentlyThrottling([currentStarted])).toBe(true);
    });
});
