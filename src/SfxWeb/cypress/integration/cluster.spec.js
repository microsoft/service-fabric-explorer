/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS } from './util';

context('Cluster page', () => {

  beforeEach(() => {

    cy.server()
    addDefaultFixtures();
  })

  describe("essentials", () => {
    it('load essentials', () => {
      cy.visit('')

      cy.wait(FIXTURE_REF_CLUSTERHEALTH)

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
      cy.route('GET', nodes_route, 'fixture:cluster-page/nodes-1-warning')
      cy.route('GET', apiUrl('/Nodes/_nt_4/$/GetHealth?*'), 'fixture:cluster-page/node-health').as('getnodeHealth')

      cy.visit('')

      cy.wait('@getnodeHealth')

      cy.contains('A cluster certificate is set to expire soon. Replace it as soon as possible to avoid catastrophic failure.')
      cy.contains('Thumbprint : 52b0278d37cbfe68f8cdf04f423a994d66ceb932')
    })
  })

  describe("details", () => {

    it('upgrade in progress', () => {
      cy.route('GET', upgradeProgress_route, 'fixture:upgrade-in-progress').as("inprogres");

      cy.route('GET', apiUrl('/Partitions/guidID?*'), 'fx:cluster-page/upgrade/get-partition-info');
      cy.route('GET', apiUrl('/Partitions/guidID/$/GetServiceName?*'), 'fx:cluster-page/upgrade/get-service-name');
      cy.route('GET', apiUrl('/Services/VisualObjectsApplicationType~VisualObjects.ActorService/$/GetApplicationName?*'), 'fx:cluster-page/upgrade/get-application-info').as('appinfo');

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.contains('Cluster Upgrade In Progress')
      cy.contains('Current Upgrade Domain : 4')

      cy.get('[data-cy=currentud').within(() => {
        cy.contains('1 - Upgrading ').click();

        cy.contains('guidID')
        cy.contains('WaitForPrimarySwap')
        cy.contains('Get Info').click();

        cy.wait('@appinfo');

        cy.contains('Application name : VisualObjectsApplicationType')
        cy.contains('min replica : 2')

      })
    })

    it('upgrade completed', () => {
      cy.visit('/#/details')

      cy.wait(FIXTURE_REF_UPGRADEPROGRESS)
      cy.contains('Latest Cluster Upgrade')
    })


  })

  describe("metrics", () => {
    it('load details', () => {
      cy.visit('/#/metrics')
      //TODO check that all nodes are queried, maybe mock to 1 node list
    })

  })

  describe("clustermap", () => {
    it('load clustermap', () => {
      cy.visit('/#/clustermap')

      cy.get('[data-cy=clustermap]').within(() => {

        cy.get('[data-cy=node]').should('have.length', 5);

        //filter
        cy.get('input').type("_nt_0");
        cy.get('[data-cy=node]').should('have.length', 1);
      })
    })

  })

  describe("image store", () => {
    it('load image store', () => {
      cy.route('GET', apiUrl('/ImageStore?*'), 'fixture:cluster-page/imagestore/base-directory').as('getbaseDirectory')
      cy.route('GET', apiUrl('/ImageStore/StoreTest?*'), 'fixture:cluster-page/imagestore/nested-directory').as('getnestedDictectory')
      cy.route('GET', apiUrl('/ImageStore/Store/VisualObjectsApplicationType/$/FolderSize?*'),
        'fixture:cluster-page/imagestore/load-size.json').as('getloadSize')

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
