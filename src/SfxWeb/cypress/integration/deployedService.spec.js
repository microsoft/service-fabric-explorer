/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@info";

context('app', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:deployed-service/deployed-apps').as('apps');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${serviceName}/$/GetHealth?*`), 'fx:deployed-service/health').as('health');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${serviceName}?*`), 'fx:deployed-service/service-info').as('info');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-service/services').as('services');

        cy.intercept(apiUrl(`ApplicationTypes/${appName}/$/GetServiceManifest?*`), 'fx:deployed-service/manifest').as('manifest');

        cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${serviceName}`)
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains(serviceName).click();
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

    describe("manifest", () => {
        it('view manifest', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('manifest').click();
            })

            cy.wait("@manifest")
            cy.url().should('include', '/manifest')
        })
    })
})