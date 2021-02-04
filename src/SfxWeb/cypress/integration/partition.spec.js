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
        addDefaultFixtures();
        cy.intercept(apiUrl(`/Applications/${appName}/$/GetServices?*`), {fixture: "app-page/services.json" }).as("services")
    })

    describe("stateful", () => {
        beforeEach(() => {
            cy.intercept(apiUrl(`${routeFormatter(appName, serviceName)}?*`), {fixture: "partition-page/partitions.json",  }).as("partitions");
            cy.intercept(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`), {fixture: "partition-page/partition-info.json"}).as("partitionInfo");
            cy.intercept(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`), {fixture: "partition-page/replicas.json"}).as("replicasList");
            cy.intercept(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetHealth?*`), {fixture: "partition-page/health.json" }).as("health");
            cy.intercept(apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetLoadInformation?*`), {fixture: "partition-page/load.json" }).as("load");

            cy.visit(urlFormatter(appName, serviceName, partitionId))
        })

        it.only('load essentials', () => {
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

            cy.wait('@load');

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