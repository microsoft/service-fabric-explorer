/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, typeIntoInput, watchForAlert, xssPrefix, plaintextXSS2 } from './util.cy';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@codePackages";

const setup = (prefix = "") => {
  addDefaultFixtures(prefix);

  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: prefix + 'deployed-code-package/deployed-apps.json' }).as('apps');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: prefix +  'deployed-code-package/service-packages.json' }).as('services');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), { fixture: prefix +  'deployed-code-package/code-packages.json' }).as('codePackages');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), { fixture: prefix + 'deployed-code-package/replicas.json' }).as('replicas');

}
const visit = () => cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/codepackage/Code`);

context('deployed code package', () => {
    beforeEach(() => {
      setup();
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

        it('essentials', () => {
          visit();
          cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains("Code").click();
            })
        })

        it('details', () => {
          visit();
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })

        it('container logs', () => {
          cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), { fixture: 'deployed-code-package/code-packages-container.json' }).as('codePackages');
          cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages/$/ContainerLogs*`), { fixture: 'deployed-code-package/container-logs.json' }).as('containerLogs');

          visit();

          cy.get('[data-cy=navtabs]').within(() => {
              cy.contains('container logs').click();
          })

          const containerRef = '[data-cy=container-logs]';
          cy.url().should('include', '/containerlogs');

          cy.wait("@containerLogs").its("request.url").should("contain", "Tail=100")

          typeIntoInput(containerRef);
          typeIntoInput(containerRef ,'500')

          cy.wait(1000)
          cy.get('[data-cy=get-logs').click();
          cy.wait("@containerLogs").its("request.url").should("contain", "Tail=500")
      })
    })

    describe("xss", () => {
      it("xss", () => {
        setup(xssPrefix);
        watchForAlert(() => {
          visit();
          cy.get('[data-cy=navtabs]').within(() => {
            cy.contains('details').click();
          })

          cy.contains(`D:\\SvcFab\\_App\\${plaintextXSS2}\\VisualObjects.ActorServicePkg.Code.3.0.0\\VisualObjects.ActorService.exe`)
        })


      })
    })
})
