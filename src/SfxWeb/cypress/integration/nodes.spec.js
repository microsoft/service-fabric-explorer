/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES } from './util';

context('nodes list page', () => {

    beforeEach(() => {

        cy.server()
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
            cy.route(apiUrl(`EventsStore/Nodes/Events?*`), "fx:empty-list").as("events");

            cy.wait(FIXTURE_REF_NODES);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })
    
            cy.wait('@events');
            cy.url().should('include', 'events');
        })
    })

})