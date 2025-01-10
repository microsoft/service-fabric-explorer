/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, addRoute, checkActions, watchForAlert, plaintextXSS2, xssPrefix } from './util.cy';

const appName = "VisualObjectsApplicationType";

const setupStateful = (baseUrl, serviceName, partitionId, primaryReplicaId, prefix = "") => {
  addRoute("partitionInfo", prefix + "replica-page/stateful-partition-info.json", apiUrl(`${baseUrl}?*`))
  addRoute("replicasList", prefix + "replica-page/stateful-replicas-list.json", apiUrl(`${baseUrl}/$/GetReplicas?*`))
  addRoute("replicaInfo", prefix + "replica-page/stateful-replica-info.json", apiUrl(`${baseUrl}/$/GetReplicas/${primaryReplicaId}?*`))
  addRoute("replicaHealth", prefix + "replica-page/health.json", apiUrl(`${baseUrl}/$/GetReplicas/${primaryReplicaId}/$/GetHealth?*`))
  addRoute("details", prefix + "replica-page/stateful-replica-detail.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplicaId}/$/GetDetail?*`))
  addRoute("partitions", prefix + "replica-page/stateful-service-partitions.json", apiUrl(`/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions?*`))
}

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
            setupStateful(baseUrl, serviceName, partitionId, replicaId)
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
        })

        it('load essentials', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Replica");
            })

            checkActions(['Restart Replica']);

            cy.get('[data-cy=address]').within(() => {
              cy.contains('10.0.0.5:20001+28bfaf73-37b0-467d-9d47-d011b0aedbc0-132429154475414363');
              cy.get("a").should('have.length', 0);
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
            addRoute("events", "empty-list.json", apiUrl(`*/$/Events?*`))

            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.url().should('include', '/events')
        })

        it('view primary commands', () => {
            cy.wait(waitRequest)

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('commands').click();
            });

            cy.url().should('include', 'commands');

            cy.wait(500);

            cy.get('[data-cy=safeCommands]');
            cy.get('[data-cy=unsafeCommands]');

            cy.get('[data-cy=command]').should('have.length', 2);

            cy.get('[data-cy=commandNav]').within(() => {
                cy.contains('Unsafe Commands').click();
            })

            cy.get('[data-cy=submit]').click();

            cy.get('[data-cy=command]').should('have.length', 2).within(() => {
                cy.contains('Restart Replica')
            });
        })

        it('view idle secondary commands', () => {
            addRoute("replicaInfo", "replica-page/stateful-idle-secondary-replica-info.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}?*`))
            cy.wait(waitRequest)

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('commands').click();
            });

            cy.url().should('include', 'commands');

            cy.wait(500);

            cy.get('[data-cy=safeCommands]');
            cy.get('[data-cy=unsafeCommands]');

            cy.get('[data-cy=command]').should('have.length', 2);

            cy.get('[data-cy=commandNav]').within(() => {
                cy.contains('Unsafe Commands').click();
            })

            cy.get('[data-cy=submit]').click();

            cy.get('[data-cy=command]').should('have.length', 5).within(() => {
                cy.contains('Restart Replica')
                cy.contains('Move Secondary Replica To Specifc Node')
                cy.contains('Move Secondary Replica To Random Node')
                cy.contains('Force Remove Replica/Instance')

            });

        })

        it('view reconfiguration text', () => {
            addRoute("partitionInfo", "replica-page/stateful-partition-reconfiguration-info.json", apiUrl(`${baseUrl}?*`))
            addRoute("replicaInfo", "replica-page/stateful-replica-reconfiguration.json", apiUrl(`${baseUrl}/$/GetReplicas/${replicaId}?*`))
            cy.wait(waitRequest)

            cy.get('[data-cy="tree-panel"]').contains('Reconfiguring: ActiveSecondary ➜ Primary');
        })
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

            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)
        })

        it('load essentials', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=header]').within(() => {
                cy.contains(replicaId);
                cy.contains("Instance");
            })

            checkActions(['Delete Instance'])

            cy.get('[data-cy=address]').within(() => {
                cy.contains('http://10.0.0.7:8081/visualobjects/');
                cy.contains('http://10.0.0.7:8081/visualobjects/data/');
                cy.get("a").should('have.length', 2);
            })
        })

        it('view commands', () => {
            cy.wait(waitRequest)

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('commands').click();
            });

            cy.url().should('include', 'commands');

            cy.wait(500);

            cy.get('[data-cy=safeCommands]');
            cy.get('[data-cy=unsafeCommands]');

            cy.get('[data-cy=command]').should('have.length', 2);

            cy.get('[data-cy=commandNav]').within(() => {
                cy.contains('Unsafe Commands').click();
            })

            cy.get('[data-cy=submit]').click();

            cy.get('[data-cy=command]').should('have.length', 2).within(() => {
                cy.contains('Move Instance')
            });;
        })
    })

    describe("xss", () => {
      it("essentials/details", () => {
        const serviceName = "VisualObjects.ActorService";
        const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
        const replicaId = "132429154475414363";
        const waitRequest = "@getreplicaInfo";
        const baseUrl = `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions/${partitionId}`;
        setupStateful(baseUrl, serviceName, partitionId, replicaId, xssPrefix);
        addRoute("events", "empty-list.json", apiUrl(`*/$/Events?*`))


        cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}/replica/${replicaId}`)

        watchForAlert(() => {
          cy.wait(waitRequest)
          cy.contains(`10.0.0.5:20001+${plaintextXSS2}-132429154475414363`);
        })

        watchForAlert(() => {
          cy.get('[data-cy=navtabs]').within(() => {
            cy.contains('details').click();
          });
          cy.contains(`10.0.0.5:20001+${plaintextXSS2}-132429154475414363`);
        })
      })
    })
})
