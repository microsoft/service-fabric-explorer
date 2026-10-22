/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST, checkCommand,
         getNodeThrottlingEvents, getStaleNodeThrottlingStartedEvent, manifest_route } from './util.cy';

context('nodes list page', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), []).as('getNodesThrottlingState');
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.visit('/#/nodes');
            cy.wait(FIXTURE_REF_NODES);

            cy.get('[data-cy=header]').within(() => {
                cy.contains('Nodes').click();
            });

            cy.get('[data-cy=nodesList]').within(() => {
                checkTableSize(5);
            })

            cy.get('[data-cy=nodes-throttling-warning]').should('not.exist');
        })

        it('shows a warning while one or more nodes are throttling', () => {
            const scriptedEvents = getNodeThrottlingEvents(['_nt_0', '_nt_1'], ['_nt_0']);
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), scriptedEvents).as('getScriptedNodesThrottlingState');

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
    })

    describe("commands", () => {
        it('view commands', () => {
            cy.visit('/#/nodes');
            cy.wait(FIXTURE_REF_NODES);

            checkCommand(1);

        })
    })

})
