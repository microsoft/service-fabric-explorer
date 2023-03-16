/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkCommand, checkTableSize, watchForAlert, xssEncoded, xssPrefix, windowAlertText, plaintextXSS2, plaintextXSS } from './util.cy';

const nodeName = "_nt_2"
const applicationName = "VisualObjectsApplicationType";
const waitRequest = "@appInfo";

const setup = (appName, visit=true, prefix = "") => {
  addDefaultFixtures(prefix);

  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: prefix + 'deployed-app-page/deployed-apps.json' }).as('apps');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}?*`), { fixture: prefix + 'deployed-app-page/deployed-app-info.json' }).as('appInfo');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetHealth?*`), { fixture: prefix + 'deployed-app-page/health.json' }).as('health');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: prefix + 'deployed-app-page/service-packages.json' }).as('services');

  if(visit) {
    cy.visit(`/#/node/${nodeName}/deployedapp/${appName}`)
  }
}

context('deployed app', () => {

    describe("essentials", () => {
        it('load essentials', () => {
          setup(applicationName)

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
          setup(applicationName)

          cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })

      })

    describe("commands", () => {
        it('view commands', () => {
          setup(applicationName)
          cy.wait(waitRequest);
          checkCommand(4, 1);
        })
    })

    describe('xss', () => {
      it('essentials/details', () => {

        setup(`*${windowAlertText}*`, false , xssPrefix);

        watchForAlert(() => {
          cy.visit(`/#/node/${nodeName}/deployedapp/${xssEncoded}`)
          cy.contains("D:\\SvcFab\\_App");
          cy.get('[data-cy=services]').within(() => {
            checkTableSize(2);
          });
        })

        watchForAlert(() => {
          cy.visit(`/#/node/${nodeName}/deployedapp/${xssEncoded}/details`)
          cy.contains(`D:\\SvcFab\\_App\\${plaintextXSS2}\\work`);
        })
      })
    })

})
