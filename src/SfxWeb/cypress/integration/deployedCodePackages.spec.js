/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@codePackages";

context('deployed code package', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: 'deployed-code-package/deployed-apps.json' }).as('apps');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: 'deployed-code-package/service-packages.json' }).as('services');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), { fixture: 'deployed-code-package/code-packages.json' }).as('codePackages');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), { fixture: 'deployed-code-package/replicas.json' }).as('replicas');
    })

    it('accessibility', () => {
      cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/codepackages`)
      cy.injectAxe();
      cy.checkA11y();
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
