/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl} from './util';

const appName = "VisualObjectsApplicationType";

/*
Default to stateful service for the page
*/
context('replica', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.route(apiUrl(`/Applications/${appName}/$/GetServices?*`), "fx:app-page/services").as("services")
    })

    describe("stateful", () => {
        const serviceName = "VisualObjects.ActorService";
        const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
        const replicaId = "132429154475414363";
        const waitRequest = "@replicaInfo";

        beforeEach(() => {
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions?*`), "fx:replica-page/stateful-service-partitions").as("partitions");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}?*`), "fx:replica-page/stateful-partition-info").as("partitionInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas?*`), "fx:replica-page/stateful-replicas-list").as("replicasList");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}?*`), "fx:replica-page/stateful-replica-info").as("replicaInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetHealth?*`), "fx:replica-page/health").as("replicaHealth");
            cy.route(apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?*`), "fx:replica-page/stateful-replica-detail").as("details");

            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
        })

        it('load essentials', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Replica");
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
            cy.route(apiUrl(`*/$/Events?*`), "fx:empty-list").as("events")

            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.url().should('include', '/events')
        })
    })

    describe("stateful", () => {
        const serviceName = "VisualObjects.WebService";
        const partitionId = "18efefc0-c136-4ba4-b1ec-d075704e412b";
        const replicaId = "132429339499004157";
        const waitRequest = "@replicaInfo";

        beforeEach(() => {
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions?*`), "fx:replica-page/stateless-service-partitions").as("partitions");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}?*`), "fx:replica-page/stateless-partition-info").as("partitionInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas?*`), "fx:replica-page/stateless-replicas-list").as("replicasList");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}?*`), "fx:replica-page/stateless-replica-info").as("replicaInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetHealth?*`), "fx:replica-page/health").as("replicaHealth");
            cy.route(apiUrl(`/Nodes/_nt_3/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?*`), "fx:replica-page/stateless-replica-detail").as("details");
        })

        it('load essentials', () => {
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Instance");
            })

            cy.get('[data-cy=address]').within(() => {
                cy.contains('http://10.0.0.7:8081/visualobjects/');
                cy.contains('http://10.0.0.7:8081/visualobjects/data/');
            })
        })
    })
})