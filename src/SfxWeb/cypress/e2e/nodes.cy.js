/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST, checkCommand,
         addRoute, getNodeThrottlingEvents, getStaleNodeThrottlingStartedEvent, manifest_route, refresh } from './util.cy';

const getNodeResourceUsageEvents = () => {
    const now = Date.now();
    return [
        {
            Kind: 'FabricProcessResourceUsage',
            NodeName: '_nt_0',
            CpuUsagePercent: 1.25,
            MemoryRssBytes: 268435456,
            MemoryTotalBytes: 8589934592,
            SampleDurationMs: 300000,
            TimeStamp: new Date(now - 120000).toISOString(),
            EventInstanceId: '00000000-0000-0000-0000-000000000001'
        },
        {
            Kind: 'FabricProcessResourceUsage',
            NodeName: '_nt_0',
            CpuUsagePercent: 4.5,
            MemoryRssBytes: 536870912,
            MemoryTotalBytes: 8589934592,
            SampleDurationMs: 300000,
            TimeStamp: new Date(now - 60000).toISOString(),
            EventInstanceId: '00000000-0000-0000-0000-000000000002'
        },
        {
            Kind: 'FabricProcessResourceUsage',
            NodeName: '_nt_1',
            CpuUsagePercent: 3,
            MemoryRssBytes: 1073741824,
            MemoryTotalBytes: 8589934592,
            SampleDurationMs: 300000,
            TimeStamp: new Date(now - 60000).toISOString(),
            EventInstanceId: '00000000-0000-0000-0000-000000000003'
        }
    ];
}

context('nodes list page', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*'), request => {
            if (request.query.eventsTypesFilter === 'FabricProcessResourceUsage') {
                request.alias = 'getNodeResourceUsage';
                request.reply(getNodeResourceUsageEvents());
            } else {
                request.alias = 'getNodesThrottlingState';
                request.reply([]);
            }
        });
        cy.visit('/#/nodes')
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.wait([FIXTURE_REF_NODES, '@getNodeResourceUsage']);

            cy.get('[data-cy=header]').within(() => {
                cy.contains('Nodes').click();
            });

            cy.get('[data-cy=nodesList]').within(() => {
                checkTableSize(5);
                cy.contains('th', 'Fabric.exe CPU');
                cy.contains('th', 'Fabric.exe Memory');
                cy.contains('tbody tr', '_nt_0').within(() => {
                    cy.contains('4.50%');
                    cy.contains('6.3%');
                });
                cy.contains('tbody tr', '_nt_1').within(() => {
                    cy.contains('3.00%');
                    cy.contains('12.5%');
                });
            })

            cy.get('[data-cy=nodes-throttling-warning]').should('not.exist');
        })

        it('shows a warning while one or more nodes are throttling', () => {
            const scriptedEvents = getNodeThrottlingEvents(['_nt_0', '_nt_1'], ['_nt_0']);
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), request => {
                if (request.query.eventsTypesFilter === 'FabricProcessResourceUsage') {
                    request.reply(getNodeResourceUsageEvents());
                } else {
                    request.alias = 'getScriptedNodesThrottlingState';
                    request.reply(scriptedEvents);
                }
            });

            cy.visit('/#/nodes');

            cy.wait('@getScriptedNodesThrottlingState');
            cy.get('@getScriptedNodesThrottlingState.all').should('have.length', 1);
            cy.get('[data-cy=nodes-throttling-warning]').within(() => {
                cy.get('.warning-icon');
                cy.contains('One or more nodes are throttling');
            });
        })

        it('ignores throttling from a previous node incarnation', () => {
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), [getStaleNodeThrottlingStartedEvent('_nt_0')])
              .as('getStaleNodesThrottlingState');

                        cy.visit('/#/nodes');

            cy.wait('@getStaleNodesThrottlingState');
            cy.get('[data-cy=nodes-throttling-warning]').should('not.exist');
        })

        it('does not request throttling events when EventStore is disabled', () => {
            let eventRequests = 0;
            cy.fixture('clusterManifest.json').then(manifest => {
                manifest.Manifest = manifest.Manifest.replace('EventStoreService', 'DisabledEventStoreService');
                cy.intercept('GET', manifest_route, manifest).as('getManifestWithoutEventStore');
            });
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), request => {
                eventRequests++;
                request.reply([]);
            });

            cy.visit('/#/nodes');

            cy.wait(['@getManifestWithoutEventStore', FIXTURE_REF_NODES]);
            cy.get('[data-cy=nodesList]');
            cy.then(() => expect(eventRequests).to.equal(0));
        })

        it('clears resource usage when EventStore becomes unavailable', () => {
            cy.wait([FIXTURE_REF_NODES, '@getNodeResourceUsage']);
            cy.get('[data-cy=nodesList]').should('contain', '4.50%').and('contain', '6.3%');

            cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'), {statusCode: 503}).as('getNodeResourceUsageFailure');
            refresh();

            cy.wait('@getNodeResourceUsageFailure');
            cy.get('[data-cy=nodesList]').should('not.contain', '4.50%').and('not.contain', '6.3%');
        })

    })

    describe("events", () => {
        it('view events', () => {
            const nodeDownEvent = {
                NodeName: '_nt_0',
                Kind: 'NodeDown',
                EventInstanceId: '00000000-0000-0000-0000-000000000005',
                TimeStamp: new Date().toISOString(),
                Category: 'StateTransition',
                HasCorrelatedEvents: false
            };
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), request => {
                request.reply([...getNodeThrottlingEvents(['_nt_0', '_nt_1']), nodeDownEvent]);
                if (!request.query.eventsTypesFilter) {
                    request.alias = 'getevents';
                }
            });

            cy.visit('/#/nodes');

            cy.wait([FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents').then(interception => {
                expect(interception.request.url).not.to.include('eventsTypesFilter');
            });
            cy.url().should('include', 'events');
            cy.contains('Nodes (5)');
            cy.contains('NodeDown');
            cy.contains('_nt_0');
            cy.contains('_nt_1');
        })

        it('displays top observed Fabric resource usage by node', () => {
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/Events?*`));
            cy.intercept(
                'GET',
                apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'),
                getNodeResourceUsageEvents()
            ).as('getClusterResourceUsage');

            cy.wait([FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST]);
            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            });

            cy.wait('@getClusterResourceUsage').its('request.url')
                .should('include', 'eventsTypesFilter=FabricProcessResourceUsage');
            cy.get('[data-cy=cluster-resource-usage-chart]').within(() => {
                cy.contains('3 samples across 2 nodes');
                cy.contains('Fabric CPU Usage: Top 10 Nodes by Peak');
                cy.contains('Fabric Memory Usage: Top 10 Nodes by Peak');
                cy.get('[data-cy=cluster-resource-cpu-chart] .highcharts-series').should('have.length', 2);
                cy.get('[data-cy=cluster-resource-memory-chart] .highcharts-series').should('have.length', 2);
            });
        })

        it('labels rankings as partial when EventStore reaches its limit', () => {
            const now = Date.now();
            const limitedEvents = Array.from({ length: 500 }, (_, index) => ({
                Kind: 'FabricProcessResourceUsage',
                NodeName: `_nt_${index % 5}`,
                CpuUsagePercent: index % 100,
                MemoryRssBytes: 536870912,
                MemoryTotalBytes: 8589934592,
                SampleDurationMs: 300000,
                TimeStamp: new Date(now - index * 1000).toISOString(),
                EventInstanceId: `00000000-0000-0000-0000-${index.toString().padStart(12, '0')}`
            }));
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/Events?*`));
            cy.intercept(
                'GET',
                apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'),
                limitedEvents
            ).as('getLimitedClusterResourceUsage');

            cy.wait([FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST]);
            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            });

            cy.wait('@getLimitedClusterResourceUsage');
            cy.get('[data-cy=cluster-resource-usage-chart]').within(() => {
                cy.contains('The 500-event limit was reached. Coverage and top-node rankings may be incomplete.');
            });
        })

        it('does not render resource graphs for clusters over 50 nodes', () => {
            cy.fixture('nodes.json').then(nodes => {
                const sourceNodes = nodes.Items;
                nodes.Items = Array.from({ length: 51 }, (_, index) => ({
                    ...sourceNodes[index % sourceNodes.length],
                    Name: `_nt_${index}`,
                    Id: { Id: index.toString(16).padStart(32, '0') }
                }));
                cy.intercept('GET', apiUrl('/Nodes/?*'), nodes).as('getLargeNodeList');
                cy.reload();
            });

            cy.wait(['@getLargeNodeList', FIXTURE_REF_MANIFEST]);
            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            });

            cy.get('[data-cy=cluster-resource-size-warning]').within(() => {
                cy.contains('Fabric resource usage graphs are not shown for clusters with more than 50 nodes because the 500-event limit can make results incomplete. This cluster has 51 nodes.');
                cy.contains('Learn more').should('not.exist');
            });
            cy.get('[data-cy=cluster-resource-cpu-chart]').should('not.be.visible');
            cy.get('[data-cy=cluster-resource-memory-chart]').should('not.be.visible');
        })

        it('omits resource usage when the runtime rejects the event kind', () => {
            let resourceUsageRequests = 0;
            cy.intercept(
                'GET',
                apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'),
                request => {
                    resourceUsageRequests++;
                    request.reply({
                        statusCode: 400,
                        body: { Error: { Code: 'E_INVALIDARG' } }
                    });
                }
            ).as('getUnsupportedResourceUsageCapability');

            cy.reload();

            cy.wait('@getUnsupportedResourceUsageCapability');
            cy.get('[data-cy=nodesList]').within(() => {
                cy.contains('th', 'Fabric.exe CPU').should('not.exist');
                cy.contains('th', 'Fabric.exe Memory').should('not.exist');
            });
            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            });
            cy.get('[data-cy=cluster-resource-usage-chart]').should('not.exist');
            cy.then(() => expect(resourceUsageRequests).to.equal(1));
        })
    })

    describe("commands", () => {
        it('view commands', () => {
            cy.visit('/#/nodes');
            cy.wait(FIXTURE_REF_NODES);

            checkCommand(1);

        })
    })

})
