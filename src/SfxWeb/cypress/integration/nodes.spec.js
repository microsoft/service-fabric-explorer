/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, addRoute, FIXTURE_REF_MANIFEST } from './util';

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
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/Events?*`));

            cy.wait([FIXTURE_REF_NODES, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents');
            cy.url().should('include', 'events');
        })
    })

})
