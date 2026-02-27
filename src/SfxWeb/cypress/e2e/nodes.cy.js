/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, FIXTURE_NODES, addRoute, FIXTURE_REF_MANIFEST, checkCommand, nodes_route } from './util.cy';

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

        it('node events show Node Type column with filter', () => {
            addRoute(FIXTURE_NODES, "node-page/nodes-with-types.json", nodes_route);
            addRoute("events", "node-page/node-events.json", apiUrl(`/EventsStore/Nodes/Events?*`));

            cy.wait([FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents');
            cy.url().should('include', 'events');

            cy.get('[data-cy=eventtabs]').within(() => {
                cy.contains('Nodes (3)');
            })

            checkTableSize(3);

            // Verify Node Type column header is present with filter button
            cy.get('thead').within(() => {
                cy.contains('Node Type');
                cy.contains('Node Type').parents('th').find('button[ngbdropdowntoggle]').should('exist');
            })

            // Verify node type values appear in the table
            cy.get('tbody').within(() => {
                cy.contains('FrontEnd');
                cy.contains('BackEnd');
            })
        })

        it('node events Node Type filter filters rows', () => {
            addRoute(FIXTURE_NODES, "node-page/nodes-with-types.json", nodes_route);
            addRoute("events", "node-page/node-events.json", apiUrl(`/EventsStore/Nodes/Events?*`));

            cy.wait([FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents');

            checkTableSize(3);

            // Open the Node Type filter dropdown and uncheck BackEnd
            cy.get('thead').contains('Node Type').parents('th').within(() => {
                cy.get('button[ngbdropdowntoggle]').click();
            })

            cy.get('ul[ngbdropdownmenu]').last().within(() => {
                cy.contains('BackEnd').click();
            })

            // After unchecking BackEnd, only FrontEnd events should show (2 rows)
            checkTableSize(2);

            // Verify no BackEnd values remain in filtered table
            cy.get('tbody').within(() => {
                cy.contains('BackEnd').should('not.exist');
                cy.contains('FrontEnd');
            })
        })
    })

    describe("commands", () => {
        it('view commands', () => {
            cy.wait(FIXTURE_REF_NODES);

            checkCommand(1);

        })
    })

})
