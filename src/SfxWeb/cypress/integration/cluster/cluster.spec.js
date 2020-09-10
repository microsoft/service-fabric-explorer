/// <reference types="cypress" />

import { apiUrl } from '../util';

context('Files', () => {

  beforeEach(() => {

    cy.server()
    cy.fixture('aad.json').as('aad');
    cy.fixture('applications.json').as('apps')
    cy.fixture('appType.json').as('appTypes')
    cy.fixture('clusterHealth.json').as('clusterHealth')
    cy.fixture('clusterHealthChunk.json').as('clusterHealthChunk')
    cy.fixture('clusterManifest.json').as('manifest')
    cy.fixture('nodes.json').as('nodes')
    cy.fixture('systemApplicationHealth.json').as('systemAppHealth')
    cy.fixture('upgradeProgress.json').as('upgrade')

    cy.route('GET', apiUrl('/$/GetAadMetadata/*'), '@aad').as('getAad')
    cy.route('GET', apiUrl('/Applications/?*'), '@apps').as('getApps')
    cy.route('GET', apiUrl('/ApplicationTypes/?*'), '@appTypes').as('getAppTypes')
    cy.route('GET', apiUrl('/$/GetClusterHealth?*'), '@clusterHealth').as('getClusterHealth')
    cy.route('POST', apiUrl('/$/GetClusterHealthChunk?*'), '@clusterHealthChunk').as('getClusterHealthChunk')
    cy.route('GET', apiUrl('/$/GetClusterManifest*'), '@manifest').as('getManifest')
    cy.route('GET', apiUrl('/Nodes/?api*'), '@nodes').as('getNodes')
    cy.route('GET', apiUrl('/Applications/System/$/GetHealth*'), '@systemAppHealth').as('getSystemAppHealth')
    cy.route('GET', apiUrl('/$/GetUpgradeProgress*'), '@upgrade').as('getUpgrades')
  })

  describe("essentials", () => {
    it('load essentials', () => {
      cy.visit('')
  
      cy.wait('@getClusterHealth')
  
      cy.get('[data-cy=nodesChart]').within(() => {
  
        cy.contains('Nodes')
        cy.contains('5')
      })
  
      cy.get('[data-cy=appsChart]').within(() => {
  
        cy.contains('Application')
        cy.contains('1')
      })
  
    })
  
    it('certificate expiring banner', () => {
      cy.fixture('cluster-page/nodes-1-warning.json').as('nodes')
      cy.route('GET', apiUrl('/Nodes/?api*'), '@nodes').as('getNodes')
    
      cy.fixture('cluster-page/node-health.json').as('nodeHealth')
      cy.route('GET', apiUrl('/Nodes/_nt_4/$/GetHealth?*'), '@nodeHealth').as('getnodeHealth')
  
      cy.visit('')
    
      cy.wait('@getnodeHealth')
  
      cy.contains('A cluster certificate is set to expire soon. Replace it as soon as possible to avoid catastrophic failure.')
      cy.contains('Thumbprint : 52b0278d37cbfe68f8cdf04f423a994d66ceb932')
    })
  })

  describe("details", () => {
    it('load details', () => {
      cy.visit('/#/details')

    })

  })

  describe("metrics", () => {
    it('load details', () => {
      cy.visit('/#/metrics')

    })

  })

  describe("clustermap", () => {
    it('load clustermap', () => {
      cy.visit('/#/clustermap')

    })

  })

  describe("image store", () => {
    it('load image store', () => {
      cy.fixture('cluster-page/imagestore/base-directory.json').as('baseDirectory')
      cy.route('GET', apiUrl('/ImageStore?*'), '@baseDirectory').as('getbaseDirectory')
  
      cy.fixture('cluster-page/imagestore/nested-directory.json').as('nestedDictectory')
      cy.route('GET', apiUrl('/ImageStore/StoreTest?*'), '@nestedDictectory').as('getnestedDictectory')
  
      cy.fixture('cluster-page/imagestore/load-size.json').as('loadSize')
      cy.route('GET', apiUrl('/ImageStore/Store/VisualObjectsApplicationType/$/FolderSize?*'), '@loadSize').as('getloadSize')
      
      cy.visit('/#/imagestore')

      cy.wait('@getbaseDirectory')

      cy.get('[data-cy=imagestore]').within(() => {
  
        cy.contains('WindowsFabricStoreTest')

        cy.contains('StoreTest').click();

        cy.contains('VisualObjectsApplicationType')

        cy.contains('Load Size').click();
        cy.contains('17.70 MB')
      })

    })

  })
})
