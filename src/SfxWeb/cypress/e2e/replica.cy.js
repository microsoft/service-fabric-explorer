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

        it('uses aligned New essentials and restores Classic', () => {
            cy.wait([waitRequest, '@getdetails', '@getreplicaHealth']);
            cy.setExperience('new');
            cy.get('.replica-summary').should('contain', '_nt_1').and('contain', 'Ready');
            cy.get('.replica-health').should('have.text', 'OK').and('have.css', 'color', 'rgb(63, 185, 80)');
            cy.get('.replica-essentials app-essential-health-tile').should('not.exist');
            cy.get('.replica-summary .overview-property-grid').should('have.css', 'display', 'grid');
            cy.get('.replica-summary .overview-property-grid > div').each(property => {
                const label = property[0].querySelector('dt').getBoundingClientRect();
                const value = property[0].querySelector('dd').getBoundingClientRect();
                expect(value.left).to.be.closeTo(label.left, 1);
                expect(value.top).to.be.at.least(label.bottom);
            });
            cy.get('.replica-summary app-clip-board').should('have.length', 3);
            cy.get('.replica-summary').should(card => {
                expect(card[0].getBoundingClientRect().width).to.be.closeTo(card[0].parentElement.getBoundingClientRect().width, 1);
            });
            cy.get('.replica-summary dd:has(app-clip-board)').each(value => {
                const text = value[0].firstElementChild.getBoundingClientRect();
                const copy = value[0].querySelector('app-clip-board').getBoundingClientRect();
                expect(copy.left - text.right).to.be.within(0, 12);
            });
            cy.get('app-navbar .detail-view-title-bar').should('have.css', 'border-bottom-width', '0px');
            cy.get('[data-cy=address]').should(card => expect(card[0].getBoundingClientRect().width).to.be.at.most(720));
            cy.contains('.replica-summary a', '_nt_1').should('have.attr', 'href').and('include', '/node/_nt_1');
            cy.get('[data-cy=address] a').should('have.length', 0);
            cy.get('[data-cy=navtabs] .current').should('have.css', 'border-bottom-color', 'rgb(247, 129, 102)');
            cy.get('app-health-viewer .nav-link.active').should('have.css', 'border-bottom-color', 'rgb(247, 129, 102)');
            cy.contains('app-health-viewer', 'No items to display.');
            cy.contains('app-health-viewer .nav-link', 'All').click();
            cy.contains('app-health-viewer', 'Partition is healthy.');
            cy.viewport(390, 1000);
            cy.get('.replica-summary').should(summary => expect(summary[0].scrollWidth).to.be.at.most(summary[0].clientWidth + 1));
            cy.setExperience('classic');
            cy.get('.replica-summary').should('not.exist');
            cy.get('.replica-essentials app-essential-health-tile img').should('have.css', 'width', '75px');
        });

        it('renders remote replicators as readable records instead of nested table cells', () => {
            cy.fixture('replica-page/stateful-replica-detail.json').then(detail => {
                const acknowledgement = { AverageReceiveDuration: 0, AverageApplyDuration: 0, NotReceivedCount: 0, ReceivedAndAppliedCount: 100 };
                detail.ReplicatorStatus = {
                    Kind: 'Primary',
                    RemoteReplicators: ['134334705266988632', '134334705266988633'].map(ReplicaId => ({
                        ReplicaId, LastAcknowledgementProcessedTimeUtc: '2026-09-10T00:35:46.361Z',
                        LastReceivedReplicationSequenceNumber: 100, LastAppliedReplicationSequenceNumber: 100, IsInBuild: false,
                        RemoteReplicatorAcknowledgementStatus: {
                            ReplicationStreamAcknowledgementDetail: acknowledgement,
                            CopyStreamAcknowledgementDetail: acknowledgement
                        }
                    }))
                };
                cy.intercept('GET', apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/GetDetail?*`), detail);
            });
            cy.reload();
            cy.setExperience('new');
            cy.get('[data-cy=navtabs]').contains('details').click();
            cy.get('[aria-label="Replicator Status"] > summary').click({ scrollBehavior: 'center' });
            cy.get('[aria-label="Replicator Status"]').should('have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record-table').should('not.exist');
            cy.get('[aria-label="Remote Replicators"] .property-record').should('have.length', 2);
            cy.get('[aria-label="Remote Replicators"] > summary').should('contain', '2 records').click();
            cy.get('[aria-label="Remote Replicators"]').should('have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record').first().should('not.have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record').first().find('summary').first().should('have.text', 'Replica 134334705266988632').click();
            cy.get('[aria-label="Remote Replicators"] .property-record').first().should('have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record').first().find('summary').first().click({ scrollBehavior: 'center' });
            cy.get('[aria-label="Remote Replicators"] .property-record').first().should('not.have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record').first().find('summary').first().click();
            cy.get('[aria-label="Remote Replicators"] .property-record').first().should('have.attr', 'open');
            cy.get('[aria-label="Remote Replicators"] .property-record').first().within(() => {
                cy.contains('dd', '134334705266988632');
                cy.contains('dd', 'false');
                cy.get('[aria-label="Remote Replicator Acknowledgement Status"] > summary').click({ scrollBehavior: 'center' });
                cy.get('[aria-label="Replication Stream Acknowledgement Detail"] > summary').click({ scrollBehavior: 'center' });
                cy.get('[aria-label="Replication Stream Acknowledgement Detail"]').should('contain', 'Average Receive Duration').and('contain', '100');
                cy.get('[aria-label="Copy Stream Acknowledgement Detail"] > summary').click({ scrollBehavior: 'center' });
                cy.get('[aria-label="Copy Stream Acknowledgement Detail"]').should('contain', 'Average Apply Duration').and('contain', '100');
            });
            [1600, 390].forEach(width => {
                cy.viewport(width, 1000);
                cy.get('[aria-label="Remote Replicators"] .property-record').should(records => {
                    [...records].forEach(record => expect(record.scrollWidth).to.be.at.most(record.clientWidth + 1));
                });
            });
            cy.setExperience('classic');
            cy.get('app-details .detail-array').should('exist');
        });

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

            cy.get('[data-cy=command]').should('have.length', 2);
            cy.contains('[data-cy=command]', 'Restart Replica');
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

            cy.get('[data-cy=command]').should('have.length', 5);
            cy.contains('[data-cy=command]', 'Restart Replica');
            cy.contains('[data-cy=command]', 'Move Secondary Replica To Specifc Node');
            cy.contains('[data-cy=command]', 'Move Secondary Replica To Random Node');
            cy.contains('[data-cy=command]', 'Force Remove Replica/Instance');

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

        it('keeps New endpoint tables readable without losing links', () => {
            cy.wait([waitRequest, '@getdetails']);
            cy.setExperience('new');
            cy.get('[data-cy=address] a').should('have.length', 2).each(link => {
                expect(link.attr('href')).to.match(/^http:\/\/10\.0\.0\.7:8081\/visualobjects\//);
                expect(link).to.have.css('color', 'rgb(88, 166, 255)');
            });
            cy.get('[data-cy=address] .table-responsive, [data-cy=address] .nested-table-container').each(wrapper => {
                expect(wrapper).to.have.css('border-top-width', '0px');
                expect(wrapper).to.have.css('padding-left', '0px');
            });
            cy.get('[data-cy=address] table td a').should('have.length', 2).each(link => {
                cy.wrap(link).closest('tr').find('th').invoke('text').should('not.be.empty');
            });
            cy.viewport(390, 1000);
            cy.get('[data-cy=address]').should(card => expect(card[0].scrollWidth).to.be.at.most(card[0].clientWidth + 1));
            cy.setExperience('classic');
            cy.get('[data-cy=address] a').should('have.length', 2);
        });

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

            cy.get('[data-cy=command]').should('have.length', 2);
            cy.contains('[data-cy=command]', 'Move Instance');;;
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
