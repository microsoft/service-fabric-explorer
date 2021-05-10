/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, nodes_route, FIXTURE_NODES, addRoute } from './util';

const nodeName = "_nt_0"
const nodeInfoRef = "@getnodeInfo"

context('node page', () => {
    beforeEach(() => {
        addDefaultFixtures();

        addRoute("nodeInfo", "node-page/node-info.json", apiUrl(`/Nodes/${nodeName}/?*`));
        addRoute("nodehealthInfo", "node-page/health.json", apiUrl(`/Nodes/${nodeName}/$/GetHealth?*`));
        addRoute("apps", "node-page/apps.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`));
        addRoute("nodeLoad", "node-load/get-node-load-information.json", apiUrl(`/Nodes/${nodeName}/$/GetLoadInformation?*`));


        // cy.intercept(apiUrl(`Nodes/${nodeName}/?*`), 'fx:node-page/node-info').as('nodeInfo');
        // cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetHealth?*`), 'fx:node-page/health').as('health');
        // cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:node-page/apps').as('apps');
        // cy.route('GET', apiUrl(`/Nodes/${nodeName}/$/GetLoadInformation?*`), 'fixture:node-load/get-node-load-information').as("nodeLoad")

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
            addRoute("deactivatedNode", "node-page/deactivated-node.json", apiUrl(`/Nodes/${nodeName}/?*`));
            addRoute(FIXTURE_NODES, "node-page/node-list.json", nodes_route);

            cy.visit(`/#/node/${nodeName}`);

            cy.wait("@getdeactivatedNode");

            cy.get('[data-cy=deactivated]').within(() => {
                cy.contains("86fa6852ad467a903afbbc67edc16b66");
            })
        })

    })

    describe("details", () => {
        it('view details', () => {
            cy.visit(`/#/node/${nodeName}`)

            cy.wait([nodeInfoRef, "@getnodehealthInfo"]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            });

            cy.wait("@getnodeLoad");
            cy.url().should('include', 'details');
            cy.get("[data-cy=load]");
        })
    })

    describe("events", () => {
        it('view events', () => {
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`));

            cy.visit(`/#/node/${nodeName}`);

            cy.wait(nodeInfoRef);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait("@getevents");
            cy.url().should('include', 'events');
        })
    })

})