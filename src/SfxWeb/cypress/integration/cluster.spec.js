/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, checkTableSize,
          upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS, FIXTURE_REF_MANIFEST } from './util';

const LOAD_INFO = "getloadinfo"

context('Cluster page', () => {

  beforeEach(() => {

    cy.server()
    addDefaultFixtures();
    cy.route('GET', apiUrl('/$/GetLoadInformation?*'), 'fx:cluster-page/upgrade/get-load-information').as(LOAD_INFO);

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
      cy.route('GET', apiUrl('/Nodes/_nt_0/$/GetHealth?*'), 'fixture:cluster-page/node-health').as('getnodeHealth')

      cy.visit('')

      cy.wait('@getnodeHealth')

      cy.contains('A cluster certificate is set to expire soon. Replace it as soon as possible to avoid catastrophic failure.')
      cy.contains('Thumbprint : 52b0278d37cbfe68f8cdf04f423a994d66ceb932')
    })

  })

  describe("details", () => {
  
    it('upgrade in progress', () => {
      cy.route('GET', upgradeProgress_route, 'fx:upgrade-in-progress').as("inprogres");

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
    it('load metrics', () => {
      cy.route('GET', nodes_route, 'fixture:cluster-page/nodes-1-warning')
      cy.route('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), 'fixture:node-load/get-node-load-information').as("nodeLoad")

      cy.visit('/#/metrics')
      cy.wait('@' + LOAD_INFO);
      cy.wait('@' + "nodeLoad");

      cy.get('app-metrics').within(() => {
        cy.contains("Reserved CpuCores");
      })
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

  describe("manifest", () => {
    it('load manifest page', () => {
      cy.visit('/#/manifest')

      cy.wait(FIXTURE_REF_MANIFEST)

      cy.get('app-manifest-viewer').within(() => {
        cy.contains("WRP_Generated_ClusterManifest");
      })
    })
  })

  describe.only("repair tasks", () => {
    const setup = (file) => {
      cy.route('GET', apiUrl('/$/GetRepairTaskList?*'), file).as('repairs')
      cy.visit('/#/repairtasks')

      cy.wait("@repairs")
    }

    it('loads properly', () => {
      setup('fixture:cluster-page/repair-jobs/simple')
      
      cy.get('[data-cy=timeline]');
      cy.get('[data-cy=pendingjobs]');
      cy.get('[data-cy=completedjobs]').within( ()=> {
        cy.contains('Completed Repair Tasks').click();  
        checkTableSize(6);
      });
    })

    it('view completd repair job', () => {
      setup('fixture:cluster-page/repair-jobs/simple')

      cy.get('[data-cy=Executing]').should('not.exist')


      cy.get('[data-cy=completedjobs]').within( ()=> {
        cy.contains('Completed Repair Tasks').click();  
        
        cy.get('tbody > tr').first().within(() =>{
           cy.get('button').click();
        });

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : Done');
          cy.contains('Restoring : Done');
        })
      });
    })

    it('view in progress repair job', () => {
      setup('fixture:cluster-page/repair-jobs/in-progress')

        
      cy.get('[data-cy=Executing]').within( ()=> {      
        cy.contains('Azure/TenantUpdate/441efe72-c74d-4cfa-84df-515b44c89060/4/1555')
      })

      cy.get('[data-cy=Approving]').within( ()=> {      
        cy.contains('Azure/TenantUpdate/441efe72-c74d-4cfa-84df-515b44c89060/4/1145')
      })

      cy.get('[data-cy=top]').within( ()=> {      
        cy.contains(2)  
        cy.contains('System.Azure.Job.TenantUpdate')
      })

      cy.get('[data-cy=pendingjobs]').within( ()=> {        
        cy.get('tbody > tr').first().within(() =>{
           cy.get('button').click();
        });

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : In Progress');
          cy.contains('Restoring : Not Started');
        })
      });
    })
  })
})
