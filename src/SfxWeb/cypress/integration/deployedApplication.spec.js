/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const waitRequest = "@appInfo";
context('app', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: 'deployed-app-page/deployed-apps.json' }).as('apps');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}?*`), { fixture: 'deployed-app-page/deployed-app-info.json' }).as('appInfo');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetHealth?*`), { fixture: 'deployed-app-page/health.json' }).as('health');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: 'deployed-app-page/service-packages.json' }).as('services');

        cy.visit(`/#/node/_nt_2/deployedapp/${appName}`)
    })

    describe("essentials", () => {

      it('accessibility', () => {
        cy.injectAxe();
        cy.checkA11y();
      })

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
