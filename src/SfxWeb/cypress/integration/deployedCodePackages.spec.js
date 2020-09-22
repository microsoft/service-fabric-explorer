/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@codePackages";

context('deployed code package', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();

        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:deployed-code-package/deployed-apps').as('apps');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-code-package/service-packages').as('services');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), 'fx:deployed-code-package/code-packages').as('codePackages');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), 'fx:deployed-code-package/replicas').as('replicas');
    })

    describe("list page", () => {
        it('load', () => {
            cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/codepackages`)

            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains("Deployed Code Packages").click();
            })

            cy.get('[data-cy=packages]').within(() => {
                checkTableSize(1);
            })
        })

    })

    describe("code package page", () => {
        beforeEach(() => {
            cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/codepackage/Code`);
        })

        it('essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains("Code").click();
            })
        })

        it('details', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })
    })
})