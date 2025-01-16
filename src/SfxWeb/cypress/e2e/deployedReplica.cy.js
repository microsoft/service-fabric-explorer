/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkCommand, checkTableSize, watchForAlert, xssPrefix, plaintextXSS2 } from './util.cy';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const replica = "132431356665040624";
const partition = "41fb6918-986b-4b6d-bff6-0495b114c720";

const waitRequest = "@replicas";

const setup = (prefix = "") => {
  addDefaultFixtures(prefix);
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: prefix + 'deployed-replica/deployed-apps.json' }).as('apps');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: prefix + 'deployed-replica/service-packages.json' }).as('services');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), { fixture: prefix + 'deployed-replica/code-packages.json' }).as('codePackages');
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), { fixture: prefix + 'deployed-replica/replicas.json' }).as('replicas');
}

const setupIndividualPage = (prefix = "") => {
  cy.intercept(apiUrl(`/Partitions/${partition}?*`), { fixture: prefix + 'deployed-replica/partition.json' }).as('partition');
  //we call this route twice with different params
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?**PartitionId=${partition}*`), { fixture: prefix + 'deployed-replica/view-replica.json' }).as('replica2')
  cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetPartitions/${partition}/$/GetReplicas/${replica}/$/GetDetail?*`), { fixture: prefix + 'deployed-replica/replica-details.json' }).as('replica-details');
}


context('deployed replica', () => {

  describe("main interactions", () => {
    beforeEach(() => {
      setup();
    })

    describe("list page", () => {
        it('load', () => {
            cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/replicas`)

            cy.wait("@apps")
            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains("Deployed Replicas").click();
            })

            cy.get('[data-cy=replicas]').within(() => {
                checkTableSize(7);
            })
        })

    })

    describe("deployed replica page", () => {
        beforeEach(() => {
          setupIndividualPage();
            cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${serviceName}/partition/${partition}/replica/${replica}`);
        })

        it('essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header]').within(() => {
                cy.contains(replica);
            })
        })

        it('details', () => {
            cy.wait('@apps')
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })
            cy.wait("@replica-details");

            cy.url().should('include', '/details')
        })

        it('commands', () => {
            cy.wait(waitRequest);

            checkCommand(1);

        })

        it('reconfiguration text', () => {
          cy.intercept(apiUrl(`/Partitions/${partition}?*`), { fixture: 'deployed-replica/partition-reconfiguration.json' }).as('partition-reconfig');
          cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), { fixture: 'deployed-replica/view-replica-reconfiguration.json' }).as('replica-reconfig');

          cy.get('[data-cy="tree-panel"]').contains('Reconfiguring: ActiveSecondary ➜ Primary');
        })
    })
  })

  describe("xss", () => {
    it("essentials/details", () => {
      setup(xssPrefix);
      setupIndividualPage(xssPrefix);

      watchForAlert(() => {
        cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${serviceName}/partition/${partition}/replica/${replica}`);

        cy.contains(`fabric:/VisualObjectsApplicationType/${plaintextXSS2}`)
      })

      watchForAlert(() => {
        cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${serviceName}/partition/${partition}/replica/${replica}/details`);

        cy.contains(`fabric:/VisualObjectsApplicationType/${plaintextXSS2}`)
      })
    })
  })

})
