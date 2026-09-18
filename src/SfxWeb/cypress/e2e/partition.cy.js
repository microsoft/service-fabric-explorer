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

        it('quorum loss', () => {
            addRoute('partitionInfo', 'partition-page/stateful-partition-in-quorum-loss-info.json', apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}?*`));
            addRoute('replicasList', 'partition-page/stateful-replicas-in-quorum-loss.json', apiUrl(`${routeFormatter(appName, serviceName)}/${partitionId}/$/GetReplicas?*`));

            cy.visit(urlFormatter(appName, serviceName, partitionId));
            cy.wait(waitRequest);

            cy.get('[data-cy=quorum-loss-tile]').within(() => {
                cy.contains('Duration');
            });
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

        it('shows replicas in build', () => {
          addRoute("load", "partition-page/replica-detail-inbuild.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            cy.contains('Inbuild Replica Status');
            // Info icon links to the docs page, and sits at the far right of the section header.
            cy.get('a[href="https://aka.ms/UnderstandingServiceFabricInbuildReplicaStatus"]').should('exist');

            cy.get('[data-cy=132431356665040624]').within(() => {
              // Replica ID and the 5-phase build stepper share the pane's header row.
              cy.contains('132431356665040624');
              cy.get('[data-cy=build-phase-stepper]').within(() => {
                cy.get('[data-cy=in-progressphase]').should('have.length', 1);
                cy.get('[data-cy=donephase]').should('have.length', 2);
                cy.get('[data-cy=pendingphase]').should('have.length', 2);
                // Tooltip/info icon was removed from the Copy Context phase item.
                cy.get('.mif-info').should('not.exist');
              });
            });

            cy.contains('Overview');
            cy.contains('Copy Progress');
            // This fixture's build is already past CopyContext (InbuildPhase: Copy) -- per the
            // fixed grey rule, it stays visible (not dimmed) once started, even after moving on.
            cy.get('[data-cy=copy-context-substepper]').should('not.have.class', 'section-greyed');
            cy.get('[data-cy=context-details]').should('not.have.class', 'section-greyed');
            cy.contains('Copy Context Valid');
            cy.contains('Hop2Legacy');
            cy.get('[data-cy=copy-details]').should('not.have.class', 'section-greyed');
            cy.contains('Full');
            cy.contains('Copy Sequence Number');
            cy.contains('Copy Catchup Sequence Number');
            cy.contains('100000');
            cy.get('[data-cy=copy-catchup-bar]').within(() => {
              cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('exist');
              cy.get('.lsn-bar-track').eq(0).should('not.have.class', 'section-greyed');
              // CopyCatchup hasn't been reached yet by this fixture -- no fill, and greyed out
              cy.get('.lsn-bar-track').eq(1).find('.lsn-bar-fill').should('not.exist');
              cy.get('.lsn-bar-track').eq(1).should('have.class', 'section-greyed');
            });
          })

          // .main-content has its own overflow:auto, so scroll the section itself into
          // view -- scrollTo('bottom') would jump past it to whatever renders below.
          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('replicas-in-build', { capture: 'fullPage' });
        })

        it('shows 4 replicas in build side by side, across different build phases', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-multi.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            cy.contains('Inbuild Replica Status');
            cy.get('.in-build-pane').should('have.length', 4);
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('replicas-in-build-multi', { capture: 'fullPage' });
        })

        it('hides ESE-specific sections entirely for a non-KVS (RC) partition', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-rc.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            // Partition-level ReplicaStatus.Kind isn't "KeyValueStore" -- these fields will
            // never populate no matter how far the build progresses, so hide them outright
            // instead of showing placeholders that can never fill in.
            cy.get('[data-cy=context-details]').should('not.exist');
            cy.get('[data-cy=copy-details]').should('not.exist');
            cy.contains('Copy Sequence Number');
            cy.get('[data-cy=copy-catchup-bar]').within(() => {
              cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('exist');
            });
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('replicas-in-build-rc', { capture: 'fullPage' });
        })

        it('hides ESE-specific sections entirely for a TStore-backed KVS partition', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-tstore.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            // ReplicaStatus.Kind is "KeyValueStore" but ProviderKind is "TStore" -- the ESE-shaped
            // detail struct is never populated for this provider (not implemented server-side),
            // so these fields should stay hidden just like the non-KVS (RC) case.
            cy.get('[data-cy=context-details]').should('not.exist');
            cy.get('[data-cy=copy-details]').should('not.exist');
            cy.contains('Copy Sequence Number');
            cy.get('[data-cy=copy-catchup-bar]').within(() => {
              cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('exist');
            });
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('replicas-in-build-tstore', { capture: 'fullPage' });
        })

        // Stepper state per phase (see inbuildPhaseOrder in replica-build-progress.component.ts):
        // phases behind the current one are "done", the current one is "in-progress", the rest "pending".
        it('shows CopyContext sub-phase progress', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-copycontext.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            cy.get('[data-cy=132431356665040624]').within(() => {
              cy.contains('132431356665040624');
              cy.get('[data-cy=build-phase-stepper]').within(() => {
                cy.get('[data-cy=in-progressphase]').should('have.length', 1);
                cy.get('[data-cy=donephase]').should('have.length', 0);
                cy.get('[data-cy=pendingphase]').should('have.length', 4);
              });
            });
            cy.contains('Establish Connection');
            cy.contains('Get Copy Context');
            // Build hasn't reached CopyContext's terminal state yet -- not greyed while active.
            cy.get('[data-cy=copy-context-substepper]').should('not.have.class', 'section-greyed');
            cy.get('[data-cy=build-progress]').within(() => {
              // No ESE detail or LSN progress this early -- sections stay in place, greyed out.
              cy.get('[data-cy=context-details]').should('have.class', 'section-greyed');
              cy.get('[data-cy=copy-details]').should('have.class', 'section-greyed');
              cy.get('[data-cy=copy-catchup-bar]').within(() => {
                cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('not.exist');
                cy.get('.lsn-bar-track').eq(1).find('.lsn-bar-fill').should('not.exist');
              });
            });
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('sub-phase-copycontext', { capture: 'fullPage' });
        })

        it('shows CopyState sub-phase progress', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-copystate.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            cy.get('[data-cy=132431356665040624]').within(() => {
              cy.contains('132431356665040624');
              cy.get('[data-cy=build-phase-stepper]').within(() => {
                cy.get('[data-cy=in-progressphase]').should('have.length', 1);
                cy.get('[data-cy=donephase]').should('have.length', 1);
                cy.get('[data-cy=pendingphase]').should('have.length', 3);
              });
            });
            cy.get('[data-cy=build-progress]').within(() => {
              cy.get('[data-cy=context-details]').should('have.class', 'section-greyed');
              cy.get('[data-cy=copy-details]').should('have.class', 'section-greyed');
              cy.get('[data-cy=copy-catchup-bar]').within(() => {
                cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('not.exist');
                cy.get('.lsn-bar-track').eq(1).find('.lsn-bar-fill').should('not.exist');
              });
            });
            // Build has moved past CopyContext (now in CopyState) -- per the fixed grey rule,
            // it stays visible/not-dimmed rather than greying out once passed.
            cy.get('[data-cy=copy-context-substepper]').should('not.have.class', 'section-greyed');
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('sub-phase-copystate', { capture: 'fullPage' });
        })

        it('shows CopyCatchup sub-phase progress', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-copycatchup.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').within(() => {
            cy.get('[data-cy=132431356665040624]').within(() => {
              cy.contains('132431356665040624');
              cy.get('[data-cy=build-phase-stepper]').within(() => {
                cy.get('[data-cy=in-progressphase]').should('have.length', 1);
                cy.get('[data-cy=donephase]').should('have.length', 3);
                cy.get('[data-cy=pendingphase]').should('have.length', 1);
              });
            });
            cy.get('[data-cy=build-progress]').within(() => {
              // Both zones and the ESE detail are ungreyed/filled by this phase.
              cy.get('[data-cy=context-details]').should('not.have.class', 'section-greyed');
              cy.get('[data-cy=copy-details]').should('not.have.class', 'section-greyed');
              cy.get('[data-cy=copy-catchup-bar]').within(() => {
                cy.get('.lsn-bar-track').eq(0).find('.lsn-bar-fill').should('exist');
                cy.get('.lsn-bar-track').eq(0).should('not.have.class', 'section-greyed');
                cy.get('.lsn-bar-track').eq(1).find('.lsn-bar-fill').should('exist');
                cy.get('.lsn-bar-track').eq(1).should('not.have.class', 'section-greyed');
              });
              cy.contains('Copy LSN: 100000');
              cy.contains('Copy Catchup LSN: 150000');
            });
            // Build has moved well past CopyContext (now in CopyCatchup) -- still not greyed.
            cy.get('[data-cy=copy-context-substepper]').should('not.have.class', 'section-greyed');
          })

          cy.get('[data-cy=build-progress]').scrollIntoView({ offset: { top: -100 } });
          cy.screenshot('sub-phase-copycatchup', { capture: 'fullPage' });
        })

        // IsInBuild lags CopyComplete by one refresh, so replicas-in-build.component.ts
        // excludes it -- the whole in-build section disappears once a build finishes.
        it('hides the in-build section once a replica reaches CopyComplete', () => {
          addRoute("load", "partition-page/replica-detail-inbuild-copycomplete.json", apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${primaryReplica}/$/GetDetail?*`));

          cy.visit(urlFormatter(appName, serviceName, partitionId));
          cy.wait(waitRequest);

          cy.get('[data-cy=replicas-in-build]').should('not.exist');
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

          cy.get('[data-cy=command]').should('have.length', 4);
          cy.contains('[data-cy=command]', 'Restart Primary Replica');
          cy.contains('[data-cy=command]', 'Move Primary Replica To Specifc Node');
          cy.contains('[data-cy=command]', 'Move Primary Replica To Random Node');

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
