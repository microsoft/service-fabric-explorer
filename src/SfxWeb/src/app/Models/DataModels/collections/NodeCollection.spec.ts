import { of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { IRawNode } from '../../RawDataTypes';
import { NodeCollection } from './NodeCollection';

describe('NodeCollection', () => {
    it('sorts Cluster Map upgrade domains numerically', async () => {
        const createNode = (name: string, upgradeDomain: string): IRawNode => ({
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
            Id: { Id: name },
            InstanceId: '0',
            NodeDeactivationInfo: {
                NodeDeactivationIntent: 'Invalid',
                NodeDeactivationStatus: 'None',
                NodeDeactivationTask: [],
                PendingSafetyChecks: []
            },
            IsStopped: false,
            NodeDownTimeInSeconds: '0',
            NodeUpAt: '',
            NodeDownAt: '',
            NodeTags: []
        });
        const data = {
            actionsEnabled: () => false,
            restClient: {
                getNodes: () => of([
                    createNode('node-10a', '10'),
                    createNode('node-0', '0'),
                    createNode('node-11', '11'),
                    createNode('node-2', '2'),
                    createNode('node-1', '1'),
                    createNode('node-10b', '10')
                ])
            }
        } as DataService;
        const nodes = new NodeCollection(data);

        await nodes.ensureInitialized().toPromise();

        expect(nodes.upgradeDomains).toEqual(['0', '1', '2', '10', '11']);
    });
});
