/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize } from './util';

const nodeName = "_nt_2"
const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorServicePkg";
const waitRequest = "@replicas";

context('deployed replica', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();

        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications?*`), 'fx:deployed-replica/deployed-apps').as('apps');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetServicePackages?*`), 'fx:deployed-replica/service-packages').as('services');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetCodePackages?*`), 'fx:deployed-replica/code-packages').as('codePackages');
        cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?*`), 'fx:deployed-replica/replicas').as('replicas');
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
            cy.route(apiUrl(`Partitions/${partition}?*`), 'fx:deployed-replica/partition').as('partition');
            //we call this route twice with different params
            cy.route(apiUrl(`Nodes/${nodeName}/$/GetApplications/${appName}/$/GetReplicas?**PartitionId=${partition}*`), 'fx:deployed-replica/view-replica')

            cy.visit(`/#/node/_nt_2/deployedapp/${appName}/deployedservice/${serviceName}/partition/${partition}/replica/${replica}`);
            
        })

        it.only('essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header]').within(() => {
                cy.contains(replica);
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