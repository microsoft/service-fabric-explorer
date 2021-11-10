/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@replicas";

context('deployed replica', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications?*`), { fixture: 'deployed-replica/deployed-apps.json' }).as('apps');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), { fixture: 'deployed-replica/service-packages.json' }).as('services');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), { fixture: 'deployed-replica/code-packages.json' }).as('codePackages');
        cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), { fixture: 'deployed-replica/replicas.json' }).as('replicas');
    })

    describe("list page", () => {

      it('accessibility', () => {
        cy.visit(`/#/node/${nodeName}/deployedapp/${appName}/deployedservice/${serviceName}/replicas`)
        cy.injectAxe();
        cy.checkA11y();
      })

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
        const replica = "132431356665040624";
        const partition = "41fb6918-986b-4b6d-bff6-0495b114c720";

        beforeEach(() => {
            cy.intercept(apiUrl(`/Partitions/${partition}?*`), { fixture: 'deployed-replica/partition.json' }).as('partition');
            //we call this route twice with different params
            cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?**PartitionId=${partition}*`), { fixture: 'deployed-replica/view-replica.json' }).as('replica2')
            cy.intercept(apiUrl(`/Nodes/${nodeName}/$/GetPartitions/${partition}/$/GetReplicas/${replica}/$/GetDetail?*`), { fixture: 'deployed-replica/replica-details.json' }).as('replica-details');

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
    })
})
