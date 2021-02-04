/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@replicas";

context('deployed replica', () => {
    beforeEach(() => {
        addDefaultFixtures();

        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:deployed-replica/deployed-apps').as('apps');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-replica/service-packages').as('services');
        cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), 'fx:deployed-replica/code-packages').as('codePackages');
        cy.rointerceptte(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), 'fx:deployed-replica/replicas').as('replicas');
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
        const replica = "132431356665040624";
        const partition = "41fb6918-986b-4b6d-bff6-0495b114c720";

        beforeEach(() => {
            cy.intercept(apiUrl(`Partitions/${partition}?*`), 'fx:deployed-replica/partition').as('partition');
            //we call this route twice with different params
            cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?**PartitionId=${partition}*`), 'fx:deployed-replica/view-replica').as('replica2')
            cy.intercept(apiUrl(`Nodes/${nodeName}/$/GetPartitions/${partition}/$/GetReplicas/${replica}/$/GetDetail?*`), 'fx:deployed-replica/replica-details').as('replica-details');

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