/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_APPTYPES, EMPTY_LIST_TEXT } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const waitRequest = "@app";
context('app', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();

        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}?*`), 'fx:deployed-app-page/deployed-app-info').as('appInfo');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetHealth?*`), 'fx:deployed-app-page/health').as('health');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-app-page/service-packages').as('services');

        cy.visit(`/#/node/_nt_2/deployedapp/VisualObjectsApplicationType`)
    })

    describe("essentials", () => {
        it('load essentials', () => {
            // cy.wait(waitRequest);
            // cy.get('[data-cy=header').within(() => {
            //     cy.contains(appName).click();
            // })

            // cy.get('[data-cy=upgradeDetails]').within(() => {
            //     cy.contains("Latest Upgrade State")
            // })

            // cy.get('[data-cy=health]').within(() => {
            //     cy.contains(EMPTY_LIST_TEXT)
            // })

            // cy.get('[data-cy=serviceTypes]').within(() => {
            //     cy.contains("VisualObjects.WebServiceType");
            //     cy.contains("VisualObjects.ActorServiceType");

            // })

            // cy.get('[data-cy=services]').within(() => {
            //     cy.contains("fabric:/VisualObjectsApplicationType/VisualObjects.WebService");
            //     cy.contains("fabric:/VisualObjectsApplicationType/VisualObjects.ActorService");
            // })
        })

    })

    // describe("details", () => {
    //     it('view details', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('details').click();
    //         })

    //         cy.url().should('include', '/details')
    //     })
    // })

})