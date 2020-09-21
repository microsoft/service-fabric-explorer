/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, EMPTY_LIST_TEXT, FIXTURE_REF_MANIFEST } from './util';

const serviceName = "VisualObjects.ActorService";
const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
const appName = "VisualObjectsApplicationType";

const waitRequest = "@partitionInfo";

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions`;
const urlFormatter = (app, service, partition) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}/partition/${partition}`;

context('service', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.route(apiUrl(`/Applications/${appName}/$/GetServices?*`), "fx:app-page/services").as("services")
    })

    describe("stateful", () => {
        beforeEach(() => {
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}?*`), "fx:partition-page/partitions").as("partitions");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`), "fx:partition-page/partition-info").as("partitionInfo");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`), "fx:partition-page/replicas").as("replicasList");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetHealth?*`), "fx:partition-page/health").as("health");

            cy.visit(urlFormatter(appName, serviceName, partitionId))
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
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
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