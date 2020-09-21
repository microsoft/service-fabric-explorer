/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_APPTYPES, EMPTY_LIST_TEXT } from './util';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@replicaInfo";


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

    // describe("stateless", () => {
    //     beforeEach(() => {
    //         cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetDescription?*`), "fx:service-page/service-stateless-description").as("description");
    //         cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}?*`), "fx:service-page/service-stateless-info").as("serviceInfo");
    //         cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetPartitions?*`), "fx:service-page/service-stateless-partitions").as("partitions");
    //         cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetHealth?*`), "fx:service-page/service-health").as("health")
    //     })

    //     it('stateless information', () => {
    //         cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${statefulServiceName}`)
    //         cy.wait("@serviceInfo");

    //         cy.get('[data-cy=stateless]').within(() => {
    //             cy.contains("Stateless")
    //             cy.contains("Instance Count")
    //         })
    //     })
    // })

    // describe("details", () => {
    //     it('view details', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('details').click();
    //         })

    //         cy.url().should('include', '/details')
    //     })
    // })

    // describe("deployments", () => {
    //     it('view details', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('deployments').click();
    //         })

    //         cy.url().should('include', '/deployments')
    //     })
    // })

    // describe("manifest", () => {
    //     it('view manifest', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('manifest').click();
    //         })

    //         cy.url().should('include', '/manifest')
    //     })
    // })

    // describe("backups", () => {
    //     it('view backup', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('backup').click();
    //         })

    //         cy.url().should('include', '/backup')
    //     })
    // })

    // describe("events", () => {
    //     it('view events', () => {
    //         cy.route(apiUrl(`EventsStore/Applications/${appName}/$/Events?*`), "fx:empty-list").as("events")

    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('events').click();
    //         })

    //         cy.url().should('include', '/events')
    //     })
    // })

})