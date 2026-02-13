import { of } from 'rxjs';
import { NodeEventList } from './Collections';
import { NodeEvent } from '../../eventstore/Events';
import { DataService } from 'src/app/services/data.service';
import { RestClientService } from 'src/app/services/rest-client.service';

describe('NodeEventList', () => {

    const restClientMock: Partial<RestClientService> = {};

    const mockDataService: DataService = {
        restClient: restClientMock as RestClientService,
    } as DataService;

    describe('column settings', () => {

        fit('should include Node Name and Node Type filter columns when viewing all nodes', () => {
            const list = new NodeEventList(mockDataService);
            const columnNames = list.settings.columnSettings.map(c => c.displayName);
            expect(columnNames).toContain('Node Name');
            expect(columnNames).toContain('Node Type');
        });

        fit('should have filter enabled on Node Name and Node Type columns', () => {
            const list = new NodeEventList(mockDataService);
            const nodeNameCol = list.settings.columnSettings.find(c => c.displayName === 'Node Name');
            const nodeTypeCol = list.settings.columnSettings.find(c => c.displayName === 'Node Type');
            expect(nodeNameCol.config.enableFilter).toBe(true);
            expect(nodeTypeCol.config.enableFilter).toBe(true);
        });

        fit('should use raw.nodeType as the property path for Node Type column', () => {
            const list = new NodeEventList(mockDataService);
            const nodeTypeCol = list.settings.columnSettings.find(c => c.displayName === 'Node Type');
            expect(nodeTypeCol.propertyPath).toBe('raw.nodeType');
        });

        fit('should NOT include Node Name or Node Type columns when viewing a specific node', () => {
            const list = new NodeEventList(mockDataService, 'node1');
            const columnNames = list.settings.columnSettings.map(c => c.displayName);
            expect(columnNames).not.toContain('Node Name');
            expect(columnNames).not.toContain('Node Type');
        });
    });

    describe('event enrichment', () => {

        // Subclass to expose protected retrieveEvents for testing
        class TestableNodeEventList extends NodeEventList {
            public callRetrieveEvents() {
                return this.retrieveEvents();
            }
        }

        fit('should enrich events with nodeType when viewing all nodes', (done) => {
            const nodeEvent1 = new NodeEvent();
            nodeEvent1.fillFromJSON({
                Kind: 'NodeDown',
                NodeName: 'node_A',
                EventInstanceId: 'evt-1',
                TimeStamp: '2024-01-01T00:00:00Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            const nodeEvent2 = new NodeEvent();
            nodeEvent2.fillFromJSON({
                Kind: 'NodeUp',
                NodeName: 'node_B',
                EventInstanceId: 'evt-2',
                TimeStamp: '2024-01-01T01:00:00Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            restClientMock.getNodeEvents = () => of([nodeEvent1, nodeEvent2]);

            const mockNodes = {
                collection: [
                    { name: 'node_A', raw: { Name: 'node_A', Type: 'FrontEnd' } },
                    { name: 'node_B', raw: { Name: 'node_B', Type: 'BackEnd' } },
                ]
            };

            const enrichDataService = {
                ...mockDataService,
                getNodes: () => of(mockNodes),
            } as any;

            const list = new TestableNodeEventList(enrichDataService);

            list.callRetrieveEvents().subscribe(results => {
                expect(results.length).toBe(2);
                expect(results[0].raw.raw.nodeType).toBe('FrontEnd');
                expect(results[1].raw.raw.nodeType).toBe('BackEnd');
                done();
            });
        });

        fit('should not set nodeType for events with unknown node names', (done) => {
            const nodeEvent = new NodeEvent();
            nodeEvent.fillFromJSON({
                Kind: 'NodeDown',
                NodeName: 'unknown_node',
                EventInstanceId: 'evt-3',
                TimeStamp: '2024-01-01T00:00:00Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            restClientMock.getNodeEvents = () => of([nodeEvent]);

            const mockNodes = {
                collection: [
                    { name: 'node_A', raw: { Name: 'node_A', Type: 'FrontEnd' } },
                ]
            };

            const enrichDataService = {
                ...mockDataService,
                getNodes: () => of(mockNodes),
            } as any;

            const list = new TestableNodeEventList(enrichDataService);

            list.callRetrieveEvents().subscribe(results => {
                expect(results.length).toBe(1);
                expect(results[0].raw.raw.nodeType).toBeUndefined();
                done();
            });
        });

        fit('should not enrich events when viewing a specific node', (done) => {
            const nodeEvent = new NodeEvent();
            nodeEvent.fillFromJSON({
                Kind: 'NodeDown',
                NodeName: 'node_A',
                EventInstanceId: 'evt-4',
                TimeStamp: '2024-01-01T00:00:00Z',
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            });

            restClientMock.getNodeEvents = () => of([nodeEvent]);

            const list = new TestableNodeEventList(mockDataService, 'node_A');

            list.callRetrieveEvents().subscribe(results => {
                expect(results.length).toBe(1);
                // Should not have nodeType set since we're viewing specific node
                expect(results[0].raw.raw.nodeType).toBeUndefined();
                done();
            });
        });
    });
});
