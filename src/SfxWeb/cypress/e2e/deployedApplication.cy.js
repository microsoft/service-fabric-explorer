/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util.cy';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const waitRequest = "@appInfo";
context('deployed app', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: 'deployed-app-page/deployed-apps.json' }).as('apps');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}?*`), { fixture: 'deployed-app-page/deployed-app-info.json' }).as('appInfo');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetHealth?*`), { fixture: 'deployed-app-page/health.json' }).as('health');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: 'deployed-app-page/service-packages.json' }).as('services');

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

    describe("commands", () => {
        it('view commands', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('commands').click();
            })

            cy.url().should('include', 'commands');
        
            cy.wait(500);

            cy.get('[data-cy=safeCommands]');
            cy.get('[data-cy=command]').should('have.length', 4);

            cy.get('[data-cy=commandNav]').within(() => {
                cy.contains('Unsafe Commands').click();
            })
    
            cy.get('[data-cy=submit]').click();
    
            cy.get('[data-cy=command]').should('have.length', 1);

        })
    })

})
