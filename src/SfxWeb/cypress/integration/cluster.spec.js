/// <reference types="cypress" />

import {
  apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, checkTableSize,
  upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS, FIXTURE_REF_MANIFEST, addRoute, checkTableErrorMessage, EMPTY_LIST_TEXT, FAILED_TABLE_TEXT, FAILED_LOAD_TEXT, repairTask_route, manifest_route, CLUSTER_TAB_NAME, REPAIR_TASK_TAB_NAME, FIXTURE_REF_NODES, FIXTURE_NODES, typeIntoInput, checkCheckBox, refresh
} from './util';

const LOAD_INFO = "getloadinfo"
const EVENT_TABS='[data-cy=eventtabs]'
const OPTION_PICKER='[data-cy=option-picker]'
const SELECT_EVENT_TYPES='[sectionName=select-event-types]'

const serviceName = "VisualObjectsApplicationType~VisualObjects.ActorService";

context('Cluster page', () => {

  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept(apiUrl('/$/GetLoadInformation?*'), { fixture: 'cluster-page/upgrade/get-load-information.json' }).as(LOAD_INFO);
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
      cy.intercept(nodes_route, { fixture: 'cluster-page/nodes-1-warning.json' })
      cy.intercept(apiUrl('/Nodes/_nt_0/$/GetHealth?*'), { fixture: 'cluster-page/node-health.json' }).as('getnodeHealth')

      cy.visit('')

      cy.wait('@getnodeHealth')

      cy.contains('A cluster certificate is set to expire soon. Replace it as soon as possible to avoid catastrophic failure.')
      cy.contains('Thumbprint : 52b0278d37cbfe68f8cdf04f423a994d66ceb932')
    })

  })

  describe("details", () => {
    beforeEach(() => {
      cy.intercept('GET', apiUrl('/Partitions/guidID?*'), { fixture: 'cluster-page/upgrade/get-partition-info.json' });
      cy.intercept('GET', apiUrl('/Partitions/guidID/$/GetServiceName?*'), { fixture: 'cluster-page/upgrade/get-service-name.json' });
      cy.intercept('GET', apiUrl('/Services/VisualObjectsApplicationType~VisualObjects.ActorService/$/GetApplicationName?*'), { fixture: 'cluster-page/upgrade/get-application-info.json' }).as('appinfo');
    })

    it('upgrade in progress', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'upgrade-in-progress.json' }).as("inprogres");

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.contains('Cluster Upgrade In Progress')

      cy.get('[data-cy=currentud]').within(() => {
        cy.contains('Node : 1').click();

        cy.wait('@appinfo');

        cy.contains('guidID')
        cy.contains('WaitForPrimarySwap')
        cy.contains(serviceName)
      })

      cy.get('[data-cy=upgrade-bar]').within(() => {
        cy.contains('Upgrade Duration : 55:04 minutes')
      })

      cy.get('[data-cy=upgrade-bar-domain]').within(() => {
        cy.contains('74 milliseconds')
      })
    })

    it('upgrade in progress - Node by Node', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/upgrade-in-progress-node-by-node.json' }).as("inprogres");

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.contains('Cluster Upgrade In Progress')

      cy.get('[data-cy=currentud]').within(() => {
        cy.contains('MyNode2').click();
      })

      cy.contains('Node by Node')

      cy.get('[data-cy=upgrade-bar]').should('not.exist')

      cy.get('[data-cy=upgrade-bar-domain]').should('not.exist');
    })

    it('upgrade in progress - no auto load safety checks', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/upgrade-in-progress-many-safety-checks.json' }).as("inprogres");

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.get('[data-cy=currentud]').within(() => {
        cy.contains('Node : 1').click();

        cy.contains('guidID')
        cy.contains('WaitForPrimarySwap')
        cy.contains(serviceName).should('not.exist');

        checkTableSize(7);

        cy.contains('Load').click();
        cy.wait('@appinfo');
        cy.contains(serviceName)

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
      cy.intercept('GET', nodes_route, { fixture: 'cluster-page/nodes-1-warning.json' })
      cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), { fixture: 'node-load/get-node-load-information.json' }).as("nodeLoad")
      cy.intercept(apiUrl('/Nodes/_nt_0/$/GetHealth?EventsHealthStateFilter=0&api-version=3.0'), { fixture: 'cluster-page/node-health.json' }).as('getnodeHealth')

      cy.visit('/#/metrics')
      cy.wait("@nodeLoad");

      cy.get('app-metrics').within(() => {
        cy.contains("Reserved CpuCores");
      })
    })

  })

  describe("clustermap", () => {
    it.only('load clustermap', () => {
      const checkNodes = (ref, expectedCount) => {

        let count = 0;
        cy.get(ref).each(item => {
          if(item.text().trim() !== "0") {
            count += parseInt(item.text().trim());
          }
        }).then(($lis) => {
          expect(count).to.equal(expectedCount)
        })
      }

      const filter_id = '[data-cy=filter]';
      const filter_nodetype_id = '[data-cy=nodetype-filter]';

      const node_ref = '[data-cy=node]';
      const node_type_ref = '[data-cy=nodetype-group]';

      const down_node_ref = '[data-cy=down-nodes]';

      cy.visit('/#/clustermap')

      checkNodes(down_node_ref, 0);

      cy.intercept('GET', nodes_route, { fixture: 'cluster-page/clustermap/nodes.json' })

      refresh();
      cy.wait(FIXTURE_REF_NODES);

      checkNodes(down_node_ref, 2);

      cy.get('[data-cy=clustermap]').within(() => {

        //filter
        cy.get(node_ref).should('have.length', 5);
        typeIntoInput(filter_id, "_nt_0");
        cy.get(node_ref).should('have.length', 1);
        typeIntoInput(filter_id);


        cy.get(node_type_ref).should('have.length', 0);
        cy.get(filter_nodetype_id).click();
        cy.get(node_type_ref).should('have.length', 5);

        //expand one of the node types
        cy.get(node_type_ref).first().click();
        cy.get(node_ref).should('have.length', 1);

      })
    })

  })

  describe("image store", () => {
    it('load image store', () => {
      addRoute('baseDirectory', 'cluster-page/imagestore/base-directory.json', apiUrl('/ImageStore?*'))
      addRoute('nestedDictectory', 'cluster-page/imagestore/nested-directory.json', apiUrl('/ImageStore/StoreTest?*'))
      addRoute('loadSize', 'cluster-page/imagestore/load-size.json', apiUrl('/ImageStore/Store/VisualObjectsApplicationType/$/FolderSize?*'))

      // cy.intercept('GET', apiUrl('/ImageStore?*'), 'fixture:cluster-page/imagestore/base-directory').as('getbaseDirectory')
      // cy.intercept('GET', apiUrl('/ImageStore/StoreTest?*'), 'fixture:cluster-page/imagestore/nested-directory').as('getnestedDictectory')
      // cy.intercept('GET', apiUrl('/ImageStore/Store/VisualObjectsApplicationType/$/FolderSize?*'),
      // 'fixture:cluster-page/imagestore/load-size.json').as('getloadSize')

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

  describe("events", () => {
    const setup = (fileCluster, fileTasks) => {
      addRoute('events', fileCluster, apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('repairs', fileTasks, repairTask_route)

      cy.visit('/#/events')

      cy.wait(['@getevents','@getrepairs'])
    };

    it("loads properly", () => {
      addRoute('events', 'empty-list.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      cy.visit('/#/')

      cy.get('[data-cy=navtabs]').within(() => {
        cy.contains('events').click();
      })

      cy.wait('@getevents');
      cy.url().should('include', 'events');

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
      })
    })

    it("repair manager disabled", () => {
      addRoute('events', 'empty-list.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('repair-manager-manifest', 'manifestRepairManagerDisabled.json', manifest_route)

      cy.visit('/#/events')
      cy.wait(['@getevents','@getrepair-manager-manifest'])

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
      })
      checkTableErrorMessage(EMPTY_LIST_TEXT);

      cy.get(SELECT_EVENT_TYPES).click()

      cy.get(OPTION_PICKER).within(() => {
        cy.get(REPAIR_TASK_TAB_NAME).should('not.exist')
      })
    })

    it("cluster events", () => {
      setup('cluster-page/eventstore/cluster-events.json', 'empty-list.json')

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
      })
      checkTableSize(15);
    })

    it("all events", () => {
      setup('cluster-page/eventstore/cluster-events.json', 'cluster-page/repair-jobs/simple.json')

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME);
      })
      checkTableSize(15);

      cy.get(SELECT_EVENT_TYPES).click()

      cy.get(OPTION_PICKER).within(() => {
        cy.contains(REPAIR_TASK_TAB_NAME)
        cy.get('[type=checkbox]').eq(1).check({force: true})
      })

      cy.get(EVENT_TABS).within(() => {
        cy.contains(REPAIR_TASK_TAB_NAME).click();
      })
      checkTableSize(6);
    })

    it("failed request",() => {
      setup('failed-events.json', 'empty-list.json')

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
        cy.get('[text=Error]')
      })

      cy.contains(FAILED_LOAD_TEXT);
      checkTableErrorMessage(FAILED_TABLE_TEXT);
    })
  })

  describe("repair tasks", () => {
    const setup = (file) => {
      addRoute('repairs', file, apiUrl('/$/GetRepairTaskList?*'))
      cy.visit('/#/repairtasks')

      cy.wait("@getrepairs")
    }

    it('loads properly', () => {
      setup('cluster-page/repair-jobs/simple.json')

      cy.get('[data-cy=timeline]');
      cy.get('[data-cy=pendingjobs]');
      cy.get('[data-cy=completedjobs]').within(() => {
        cy.contains('Completed Repair Tasks').click();
        checkTableSize(6);
      });
    })

    it('view completed repair job', () => {
      setup('cluster-page/repair-jobs/simple.json')

      cy.get('[data-cy=Executing]').should('not.exist')


      cy.get('[data-cy=completedjobs]').within(() => {
        cy.contains('Completed Repair Tasks').click();

        cy.get('tbody > tr').first().within(() => {
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
      setup('cluster-page/repair-jobs/in-progress.json')


      cy.get('[data-cy=Executing]').within(() => {
        cy.contains('Azure/TenantUpdate/441efe72-c74d-4cfa-84df-515b44c89060/4/1555')
      })

      cy.get('[data-cy=Approving]').within(() => {
        cy.contains('Azure/TenantUpdate/441efe72-c74d-4cfa-84df-515b44c89060/4/1145')
      })

      cy.get('[data-cy=top]').within(() => {
        cy.contains(2)
        cy.contains('System.Azure.Job.TenantUpdate')
      })

      cy.get('[data-cy=pendingjobs]').within(() => {
        cy.get('tbody > tr').first().within(() => {
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
