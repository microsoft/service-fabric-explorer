/// <reference types="cypress" />

import {
  apiUrl, addDefaultFixtures, watchForAlert, xssPrefix
} from './util.cy';

const FM_REPLICAS_ROUTE = apiUrl('/Applications/System/$/GetServices/System%2FFailoverManagerService/$/GetPartitions/00000000-0000-0000-0000-000000000001/$/GetReplicas?*');
const FM_PARTITION_ROUTE = apiUrl('/Applications/System/$/GetServices/System%2FFailoverManagerService/$/GetPartitions/00000000-0000-0000-0000-000000000001?*');
const CM_REPLICAS_ROUTE = apiUrl('/Applications/System/$/GetServices/System%2FClusterManagerService/$/GetPartitions/00000000-0000-0000-0000-000000002000/$/GetReplicas?*');
const CM_PARTITION_ROUTE = apiUrl('/Applications/System/$/GetServices/System%2FClusterManagerService/$/GetPartitions/00000000-0000-0000-0000-000000002000?*');
const NODES_ROUTE = apiUrl('/Nodes/?*');
const REPLICA_DETAIL_ROUTE = apiUrl('/Nodes/*/$/GetPartitions/*/$/GetReplicas/*/$/GetDetail?*');
const FMM_INFO_ROUTE = apiUrl('/$/GetFailoverManagerManagerInformation?*');

context('cluster-insights', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', FM_PARTITION_ROUTE, { fixture: 'cluster-insights/partition.json' }).as('fmPartition');
    cy.intercept('GET', FM_REPLICAS_ROUTE, { fixture: 'cluster-insights/replicas.json' }).as('fmReplicas');
    cy.intercept('GET', CM_PARTITION_ROUTE, { fixture: 'cluster-insights/partition.json' }).as('cmPartition');
    cy.intercept('GET', CM_REPLICAS_ROUTE, { fixture: 'cluster-insights/replicas.json' }).as('cmReplicas');
    cy.intercept('GET', NODES_ROUTE, { fixture: 'cluster-insights/nodes-list.json' }).as('nodes');
    cy.intercept('GET', REPLICA_DETAIL_ROUTE, { fixture: 'cluster-insights/replica-detail.json' }).as('replicaDetail');
    cy.intercept('GET', FMM_INFO_ROUTE, { fixture: 'cluster-insights/fmm-info.json' }).as('fmmInfo');
  });

  describe('load page', () => {
    it('cluster insights page', () => {
      cy.visit('/#/cluster-insights');
      cy.get('app-nodes').should('exist');
      cy.get('app-replica-list').should('exist');
    });
  });

  describe('nodes panel', () => {
    it('all nodes tab', () => {
      cy.visit('/#/cluster-insights');
      cy.wait('@nodes');

      cy.get('app-nodes').within(() => {
        cy.contains('a.nav-link', 'All Nodes').click();
        cy.get('tbody > tr').should('have.length', 5);
      });
    });

    it('seed nodes tab', () => {
      cy.visit('/#/cluster-insights');
      cy.wait('@nodes');

      cy.get('app-nodes').within(() => {
        cy.contains('a.nav-link', 'Seed Nodes').click();
        cy.get('tbody > tr').should('have.length', 5);
      });
    });
  });

  describe('system services panel', () => {
    it('failover-manager tab', () => {
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@fmPartition', '@fmReplicas']);
      
      cy.contains('a.nav-link', 'Failover Manager').should('exist');
      cy.get('app-replica-list').within(() => {
        cy.get('tbody > tr').should('have.length', 3);
      });
    });

    it('cluster-manager tab', () => {
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@cmPartition', '@cmReplicas']);
      
      cy.contains('a.nav-link', 'Cluster Manager').click();
      cy.get('app-replica-list').within(() => {
        cy.get('tbody > tr').should('have.length', 3);
      });
    });
  });

  describe('quorum loss scenarios', () => {
    beforeEach(() => {
      cy.intercept('GET', FM_PARTITION_ROUTE, { fixture: 'cluster-insights/partition-quorum-loss.json' }).as('fmPartitionQL');
      cy.intercept('GET', FM_REPLICAS_ROUTE, { fixture: 'cluster-insights/replicas-quorum-loss.json' }).as('fmReplicasQL');
    });

    it('display InQuorumLoss status', () => {
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@fmPartitionQL', '@fmReplicasQL']);

      cy.get('app-replica-list').within(() => {
        cy.contains('a.nav-link', 'Failover Manager').click();
        cy.contains('InQuorumLoss').should('exist');
        cy.contains('Quorum Loss Duration').should('exist');
      });
    });
  });

  describe('replica details', () => {
    it('show replica detail for active replica', () => {
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@fmPartition', '@fmReplicas']);

      cy.get('app-replica-list').within(() => {
        cy.contains('a.nav-link', 'Failover Manager').click();
        
        cy.wait('@replicaDetail');
        cy.get('tbody > tr').first().within(() => {
          cy.get('span.replica-id-link').click();
        });
        
        cy.get('[data-cy=replica-detail-panel]').should('be.visible');
        cy.get('[data-cy=replica-detail-panel]').contains('th', 'Reconfiguration Type').should('exist');
      });
    });
  });

  describe('FMM information', () => {
    it('get info from GetFailoverManagerManagerInformation API', () => {
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@fmPartition', '@fmReplicas', '@fmmInfo']);

      cy.get('[data-cy=fmm-info]').should('exist');
      cy.get('[data-cy=fmm-node-name]').should('exist').and('not.be.empty');
      cy.get('[data-cy=fmm-node-id]').should('exist').and('not.be.empty');
      cy.get('[data-cy=fmm-node-instance-id]').should('exist').and('not.be.empty');
    });

    // This is a SF version backward compatibility test, since FMM info API is introduced in SF 11.4.
    it('get (estimated) info from nodes', () => {
      cy.intercept('GET', FMM_INFO_ROUTE, { statusCode: 404 }).as('fmmInfoNotFound');
      cy.visit('/#/cluster-insights');
      cy.wait(['@nodes', '@fmPartition', '@fmReplicas']);

      cy.get('[data-cy=fmm-info]').should('exist');
      cy.get('[data-cy=fmm-node-name]').should('exist').and('not.be.empty');
      cy.get('[data-cy=fmm-node-id]').should('exist').and('not.be.empty');
      cy.get('[data-cy=fmm-node-instance-id]').should('exist').and('not.be.empty');
    });
  });
});
