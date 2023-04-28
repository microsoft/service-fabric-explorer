/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, addRoute, checkCommand, watchForAlert, xssEncoded, xssPrefix, windowAlertText } from './util.cy';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@getinfo";

const setup = (service, prefix = "") => {
  addRoute("apps", prefix + "deployed-service/deployed-apps.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`));
  addRoute("health", prefix + "deployed-service/health.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${service}/$/GetHealth?*`));
  addRoute("info", prefix + "deployed-service/service-info.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages/${service}?*`));
  addRoute("services", prefix + "deployed-service/services.json", apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`));
  addRoute("manifest", prefix + "deployed-service/manifest.json", apiUrl(`/ApplicationTypes/${appName}/$/GetServiceManifest?*`));

}

context('deployed service package', () => {
  describe("main interactions", () => {
    beforeEach(() => {
      addDefaultFixtures();
      setup(serviceName);
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

    describe("commands", () => {
        it('view commands', () => {
            cy.wait(waitRequest);

            checkCommand(3, 1);

        })
    })
  })

  describe("xss", () => {
    it("essentials/details", () => {
      addDefaultFixtures(xssPrefix);

      setup(`*${windowAlertText}*`, xssPrefix)

      watchForAlert(() => {
        cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${xssEncoded}`);
        cy.contains('3.0.0')
      })


      watchForAlert(() => {
        cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${xssEncoded}/details`);
        cy.contains('3.0.0')
      })
    })
  })
})
