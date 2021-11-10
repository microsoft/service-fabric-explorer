/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, EMPTY_LIST_TEXT, FIXTURE_REF_MANIFEST, addRoute } from './util';

const serviceName = "VisualObjects.ActorService";
const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
const appName = "VisualObjectsApplicationType";

const waitRequest = "@getpartitionInfo";

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions`;
const urlFormatter = (app, service, partition) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}/partition/${partition}`;

context('service', () => {
    beforeEach(() => {
        addDefaultFixtures();
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`));
    })

    describe("stateful", () => {
        beforeEach(() => {
            addRoute("partitions", "partition-page/partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
            addRoute("partitionInfo", "partition-page/partition-info.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`));
            addRoute("replicasList", "partition-page/replicas.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`));
            addRoute("health", "partition-page/health.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetHealth?*`));
            addRoute("load", "partition-page/load.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetLoadInformation?*`));

            cy.visit(urlFormatter(appName, serviceName, partitionId))
        })

        it('accessibility', () => {
          cy.injectAxe();
          cy.checkA11y();
        })

        it('load essentials', () => {
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(partitionId).click();
            })

            cy.get('[data-cy=health]').within(() => {
                cy.contains(EMPTY_LIST_TEXT).click();
            })

            cy.get('[data-cy=replicas]').within(() => {
                checkTableSize(3);
            })
        })

        it('view details', () => {
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.wait('@getload');

            cy.url().should('include', '/details');
        })

        it('view events', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.url().should('include', '/events')
        })

    })
})
