/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, nodes_route, FIXTURE_NODES  } from './util';

const nodeName = "_nt_0"
const nodeInfoRef = "@nodeInfo"

context('node page', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.intercept(apiUrl(`Nodes/${nodeName}/?*`), 'fx:node-page/node-info').as('nodeInfo');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetHealth?*`), 'fx:node-page/health').as('health');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:node-page/apps').as('apps');
        cy.route('GET', apiUrl(`/Nodes/${nodeName}/$/GetLoadInformation?*`), 'fixture:node-load/get-node-load-information').as("nodeLoad")

    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.visit(`/#/node/${nodeName}`);

            cy.wait(FIXTURE_REF_NODES);

            cy.get('[data-cy=header]').within(() => {
                cy.contains('_nt_0').click();
              });

            cy.get('[data-cy=tiles]').within(() => {
                cy.contains('6').click();
                cy.contains('2').click();
                cy.contains('5').click();
            });

            cy.get('[data-cy=appsList]').within(() => {
                checkTableSize(1);
            })

            cy.get('[data-cy=deactivated').should('not.exist');
        })

        it('deactivated', () => {
            cy.intercept(apiUrl(`Nodes/${nodeName}/?*`), 'fx:node-page/deactivated-node').as('deactivatedNode');
            cy.intercept(nodes_route, 'fx:node-page/node-list').as(FIXTURE_NODES);

            cy.visit(`/#/node/${nodeName}`);

            cy.wait("@deactivatedNode");

            cy.get('[data-cy=deactivated]').within(() => {
                cy.contains("86fa6852ad467a903afbbc67edc16b66");
            })
        })

    })

    describe("details", () => {
        it('view details', () => {
            cy.intercept('GET', apiUrl(`/Nodes/${nodeName}/$/GetLoadInformation?*`), 'fixture:node-load/get-node-load-information').as("nodeLoad")

            cy.visit(`/#/node/${nodeName}`)

            cy.wait([nodeInfoRef, "@health"]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            });
    
            cy.wait("@nodeLoad" );
            cy.url().should('include', 'details');
            cy.get("[data-cy=load]");
        })
    })

    describe("events", () => {
        it('view events', () => {
            cy.intercept(apiUrl(`EventsStore/Nodes/${nodeName}/$/Events?*`), "fx:empty-list").as("events")

            cy.visit(`/#/node/${nodeName}`);

            cy.wait([nodeInfoRef
            ]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })
    
            cy.wait("@events");
            cy.url().should('include', 'events');
        })
    })

})