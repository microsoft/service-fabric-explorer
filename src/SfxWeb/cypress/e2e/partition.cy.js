// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, EMPTY_LIST_TEXT, FIXTURE_REF_MANIFEST, addRoute, checkCommand, refresh } from './util.cy';

const serviceName = "VisualObjects.ActorService";
const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
const appName = "VisualObjectsApplicationType";
const selfReconfiguringServiceName = "VisualObjects.SelfReconfiguringService";
const selfreconfiguringPartitionId = "79dd3bba-966d-42c2-89b1-baa4580b462c";

const primaryReplica = "132429154475414363";

const waitRequest = "@getpartitionInfo";

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions`;
const urlFormatter = (app, service, partition) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}/partition/${partition}`;

const setup = (partition, replica, prefix="") => {
  addRoute("partitions", prefix + "partition-page/partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
  addRoute("partitionInfo", prefix + "partition-page/stateful-partition-info.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`));
  addRoute("replicasList", prefix + "partition-page/replicas.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`));
  addRoute("health", prefix + "partition-page/health.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetHealth?*`));
  addRoute("load", prefix + "partition-page/load.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetLoadInformation?*`));

  addRoute("load", "partition-page/replica-detail.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

}

const setupSelfReconfiguring = (partition, prefix="") => {
  addRoute("partitions", prefix + "partition-page/selfreconfiguring-partitions.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}?*`));
  addRoute("partitionInfo", prefix + "partition-page/selfreconfiguring-partition-info.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}/${selfreconfiguringPartitionId}?*`));
  addRoute("replicasList", prefix + "partition-page/selfreconfiguring-replicas.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}/${selfreconfiguringPartitionId}/$/GetReplicas?*`));
  addRoute("health", prefix + "partition-page/selfreconfiguring-health.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}/${selfreconfiguringPartitionId}/$/GetHealth?*`));
  addRoute("load", prefix + "partition-page/selfreconfiguring-replica-detail.json", apiUrl(`/Nodes/_nt1_1/$/GetPartitions/${selfreconfiguringPartitionId}/$/GetReplicas/1/$/GetDetail?*`));
}

context('partition', () => {
    beforeEach(() => {
        addDefaultFixtures();
        setup(partitionId, primaryReplica)
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`));
    })

    describe("stateful", () => {
        beforeEach(() => {

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

        it('replicator', () => {
          cy.get('[data-cy=replicator]').within(() => {
            // cy.contains('events').click();

            cy.get('[data-cy=essentials]').within(() => {
              cy.contains('13%').click();
              cy.contains('1.01 KB').click();
          })

          cy.get('[data-cy=132422367823912071]').within(() => {
            cy.get('[data-cy=view-replication]').click();

            cy.get('[data-cy=main-info]').within(() => {
              cy.contains('ActiveSecondary');
              cy.contains('_nt_4');
              cy.contains('Ready');
            })

            cy.get('[data-cy=replicator-info]').within(() => {
              cy.contains('123');
              cy.contains('456');
              cy.contains('789');
              cy.contains('321');

              cy.contains('Copy').click();

              cy.contains('423');
              cy.contains('645');
              cy.contains('879');
              cy.contains('432');
            })

            cy.get('[data-cy=current-state]').within(() => {
              cy.contains('519513853');
            })
          })

          cy.get('[data-cy=132429154475414363]').should('have.css', 'border-left-color', 'rgb(255, 255, 0)')
          cy.get('[data-cy=132431356665040624]').should('have.css', 'border-left-color', 'rgb(255, 0, 0)')
        })
        })

        describe("backups", () => {
          it('view backup', () => {
            cy.get('[data-cy=navtabs]').within(() => {
              cy.contains('backups').click();
            })

            cy.url().should('include', `${partitionId}/backups`)
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

          cy.get('[data-cy=command]').should('have.length', 3);

          cy.get('[data-cy=commandNav]').within(() => {
              cy.contains('Unsafe Commands').click();
          })

          cy.get('[data-cy=submit]').click();

          cy.get('[data-cy=command]').should('have.length', 4).within(() => {
            cy.contains('Restart Primary Replica')
            cy.contains('Move Primary Replica To Specifc Node')
            cy.contains('Move Primary Replica To Random Node')

          });

      })
    })

  describe("stateless", () => {
    beforeEach(() => {
      addRoute("partitions", "partition-page/partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
      addRoute("partitionInfo", "partition-page/stateless-partition-info.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`));

      cy.visit(urlFormatter(appName, serviceName, partitionId))
    })

    it('view commands', () => {
      cy.wait(waitRequest)

      checkCommand(3, 1);

    })

  })

  describe("selfreconfiguring", () => {
        beforeEach(() => {
            setupSelfReconfiguring(selfreconfiguringPartitionId)
            
            cy.visit(urlFormatter(appName, selfReconfiguringServiceName, selfreconfiguringPartitionId))
        })

        it('replicas', () => {
          cy.get('[data-cy=replicas]').within(() => {
              // cy.contains('events').click();
              checkTableSize(2)
              // Check column headers
              cy.contains('th', 'Activation State');
              
              cy.contains('SelfReconfiguringMember');
              cy.contains('_nt1_1');
              cy.contains('Ready');
              cy.contains('Activated');
          })
        })

        it('reconfiguration information', () => {
          // Override the routes from beforeEach with reconfiguration data
          // Using the same route names ensures these intercepts replace the previous ones
          addRoute("partitions", "partition-page/selfreconfiguring-partitions-reconfiguration.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}?*`));
          addRoute("partitionInfo", "partition-page/selfreconfiguring-partition-reconfiguration.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}/${selfreconfiguringPartitionId}?*`));
          addRoute("replicasList", "partition-page/selfreconfiguring-replica-reconfiguration.json", apiUrl(`${routeFormatter(appName, selfReconfiguringServiceName)}/${selfreconfiguringPartitionId}/$/GetReplicas?*`));

          // Trigger a refresh to fetch the new mocked reconfiguration data
          refresh();

          // Wait for the intercepted routes to complete before making assertions
          cy.wait(['@getpartitions', '@getpartitionInfo', '@getreplicasList']);
          
          // Additional wait to ensure UI has been updated with the new data
          cy.wait(500);

          cy.get('[data-cy=replicas]', { timeout: 10000 }).within(() => {
            cy.contains('Down');
            cy.contains('Reconfiguring: SelfReconfiguringMember ➜ SelfReconfiguringMember');
            cy.contains('Reconfiguring: Deactivated ➜ Activated');
          })
        })
    })
})
