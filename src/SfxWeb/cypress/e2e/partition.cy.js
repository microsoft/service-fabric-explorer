/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, checkTableSize, EMPTY_LIST_TEXT, FIXTURE_REF_MANIFEST, addRoute, checkCommand } from './util.cy';

const serviceName = "VisualObjects.ActorService";
const partitionId = "28bfaf73-37b0-467d-9d47-d011b0aedbc0";
const appName = "VisualObjectsApplicationType";

const primaryReplica = "132429154475414363";

const waitRequest = "@getpartitionInfo";

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions`;
const urlFormatter = (app, service, partition) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}/partition/${partition}`;

context('partition', () => {
    beforeEach(() => {
        addDefaultFixtures();
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`));
    })

    describe("stateful", () => {
        beforeEach(() => {
            addRoute("partitions", "partition-page/partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
            addRoute("partitionInfo", "partition-page/stateful-partition-info.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`));
            addRoute("replicasList", "partition-page/replicas.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`));
            addRoute("health", "partition-page/health.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetHealth?*`));
            addRoute("load", "partition-page/load.json", apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetLoadInformation?*`));

            addRoute("load", "partition-page/replica-detail.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

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
})
