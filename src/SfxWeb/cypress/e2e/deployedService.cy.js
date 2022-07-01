/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, addRoute } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@getinfo";

context('deployed service package', () => {
    beforeEach(() => {
        addDefaultFixtures();


        addRoute("apps", "deployed-service/deployed-apps.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`));
        addRoute("health", "deployed-service/health.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${serviceName}/$/GetHealth?*`));
        addRoute("info", "deployed-service/service-info.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${serviceName}?*`));
        addRoute("services", "deployed-service/services.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`));
        addRoute("manifest", "deployed-service/manifest.json", apiUrl(`/ApplicationTypes/${appName}/$/GetServiceManifest?*`));

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

            cy.url().should('include', '/manifest')
        })
    })
})
