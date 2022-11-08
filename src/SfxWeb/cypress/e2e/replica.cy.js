/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, addRoute, checkActions } from './util.cy';

const appName = "VisualObjectsApplicationType";


/*
Default to stateful service for the page
*/
context('replica', () => {
    beforeEach(() => {
        addDefaultFixtures();
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`))
    })

    describe("stateful", () => {
        const serviceName = "VisualObjects.ActorService";
        const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
        const replicaId = "132429154475414363";
        const waitRequest = "@getreplicaInfo";
        const baseUrl = `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions/${partitionId}`;

        beforeEach(() => {
            addRoute("partitionInfo", "replica-page/stateful-partition-info.json", apiUrl(`${baseUrl}?*`))
            addRoute("replicasList", "replica-page/stateful-replicas-list.json", apiUrl(`${baseUrl}/$/GetReplicas?*`))
            addRoute("replicaInfo", "replica-page/stateful-replica-info.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}?*`))
            addRoute("replicaHealth", "replica-page/health.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}/$/GetHealth?*`))
            addRoute("details", "replica-page/stateful-replica-detail.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?*`))
            addRoute("partitions", "replica-page/stateful-service-partitions.json", apiUrl(`/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions?*`))

            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
        })

        it('load essentials', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Replica");
            })

            checkActions(['Restart Replica'])
        })

        it('view details', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })


        it('view events', () => {
            addRoute("events", "empty-list.json", apiUrl(`*/$/Events?*`))

            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.url().should('include', '/events')
        })

        // it('view primary commands', () => {
        //     cy.wait(waitRequest)

        //     cy.get('[data-cy=navtabs]').within(() => {
        //         cy.contains('commands').click();
        //     });
    
        //     cy.url().should('include', 'commands');
            
        //     cy.wait(500);
    
        //     cy.get('[data-cy=safeCommands]');
        //     cy.get('[data-cy=unsafeCommands]');
    
        //     cy.get('[data-cy=command]').should('have.length', 2);
    
        //     cy.get('[data-cy=commandNav]').within(() => {
        //         cy.contains('Unsafe Commands').click();
        //     })
    
        //     cy.get('[data-cy=submit]').click();
    
        //     cy.get('[data-cy=command]').should('have.length', 2).within(() => {
        //         cy.contains('Restart Replica')
        //       });;
        // })
    })

    describe("stateless", () => {
        const serviceName = "VisualObjects.WebService";
        const partitionId = "18efefc0-c136-4ba4-b1ec-d075704e412b";
        const replicaId = "132429339499004157";
        const waitRequest = "@getreplicaInfo";
        const baseUrl = `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions/${partitionId}`;

        beforeEach(() => {
            addRoute("partitionInfo", "replica-page/stateless-partition-info.json", apiUrl(`${baseUrl}?*`))
            addRoute("replicasList", "replica-page/stateless-replicas-list.json", apiUrl(`${baseUrl}/$/GetReplicas?*`))
            addRoute("replicaInfo", "replica-page/stateless-replica-info.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}?*`))
            addRoute("replicaHealth", "replica-page/health.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}/$/GetHealth?*`))
            addRoute("details", "replica-page/stateless-replica-detail.json", apiUrl(`/Nodes/_nt_3/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?*`))
            addRoute("partitions", "replica-page/stateless-service-partitions.json", apiUrl(`/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions?*`))
        })

        it('load essentials', () => {
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Instance");
            })

            checkActions(['Delete Instance'])

            cy.get('[data-cy=address]').within(() => {
                cy.contains('http://10.0.0.7:8081/visualobjects/');
                cy.contains('http://10.0.0.7:8081/visualobjects/data/');
            })
        })
    })
})
