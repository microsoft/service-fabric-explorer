/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const waitRequest = "@appInfo";
context('app', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();

        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:deployed-app-page/deployed-apps').as('apps');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}?*`), 'fx:deployed-app-page/deployed-app-info').as('appInfo');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetHealth?*`), 'fx:deployed-app-page/health').as('health');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-app-page/service-packages').as('services');

        cy.visit(`/#/node/_nt_2/deployedapp/${appName}`)
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains("fabric:/VisualObjectsApplicationType").click();
            })

            cy.get('[data-cy=services]').within(() => {
                checkTableSize(2);
            })

        })

    })

    describe("details", () => {
        it('view details', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })
    })

})