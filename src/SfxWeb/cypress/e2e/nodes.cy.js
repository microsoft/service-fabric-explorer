/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST, checkCommand, getNodeThrottlingEvents } from './util.cy';

context('nodes list page', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.visit('/#/nodes')
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.wait(FIXTURE_REF_NODES);

            cy.get('[data-cy=header]').within(() => {
                cy.contains('Nodes').click();
            });

            cy.get('[data-cy=nodesList]').within(() => {
                checkTableSize(5);
            })
        })

    })

    describe("events", () => {
        it('view events', () => {
            cy.intercept('GET', apiUrl(`/EventsStore/Nodes/Events?*`), getNodeThrottlingEvents(['_nt_0', '_nt_1'])).as('getevents');

            cy.wait([FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents').then(interception => {
                expect(interception.request.url).to.include('eventsTypesFilter=NodeMessageThrottlingStarted,NodeMessageThrottlingEnded');
            });
            cy.url().should('include', 'events');
            cy.contains('Node Throttling (4)');
            cy.contains('_nt_0');
            cy.contains('_nt_1');
        })
    })

    describe("commands", () => {
        it('view commands', () => {
            cy.wait(FIXTURE_REF_NODES);

            checkCommand(1);

        })
    })

})
