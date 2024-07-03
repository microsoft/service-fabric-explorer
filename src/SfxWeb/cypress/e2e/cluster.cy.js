/// <reference types="cypress" />

import {
  apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, checkTableSize,
  upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS, FIXTURE_REF_MANIFEST, addRoute,
  checkTableErrorMessage, EMPTY_LIST_TEXT, FAILED_TABLE_TEXT, FAILED_LOAD_TEXT,
  repairTask_route, manifest_route, CLUSTER_TAB_NAME, REPAIR_TASK_TAB_NAME,
  FIXTURE_REF_NODES, OPTION_PICKER, typeIntoInput, SELECT_EVENT_TYPES, refresh,
  FIXTURE_REF_SYSTEMAPPS, systemApps_route, checkCommand, FIXTURE_REF_APPTYPES, watchForAlert, xssPrefix, FIXTURE_MANIFEST
} from './util.cy';

const LOAD_INFO = "getloadinfo"
const EVENT_TABS = '[data-cy=eventtabs]'
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

      cy.get('[role="alert"]').should('not.exist')
      cy.get('[role="jobs"]').should('not.exist')
    })

    it('certificate expiring banner', () => {
      cy.intercept(nodes_route, { fixture: 'cluster-page/nodes-1-warning.json' })
      cy.intercept(apiUrl('/Nodes/_nt_0/$/GetHealth?*'), { fixture: 'cluster-page/node-health.json' }).as('getnodeHealth')

      cy.visit('')

      cy.wait('@getnodeHealth')

      cy.contains('A cluster certificate is set to expire soon. Replace it as soon as possible to avoid catastrophic failure.')
      cy.contains('Thumbprint : 52b0278d37cbfe68f8cdf04f423a994d66ceb932')
    })

    it('long running job in approval', () => {
      cy.intercept(repairTask_route, { fixture: 'cluster-page/repair-jobs/long-running-approval.json' }).as("repairTasks")

      cy.visit('')

      cy.contains('The repair job jobOfInterest is potentially stuck');

      cy.get('[title="Repair Jobs In Progress"]').within(() => {
        cy.contains('2');
      });

      cy.get('[data-cy="jobs"]').click().within(() => {
        cy.contains('jobOfInterest')
      });

    })

    it('xss', () => {

      addDefaultFixtures(xssPrefix);

      watchForAlert(() => {
        cy.visit('')
      })
    });
  })

  describe("details", () => {
    beforeEach(() => {
      cy.intercept('GET', apiUrl('/Partitions/guidID?*'), { fixture: 'cluster-page/upgrade/get-partition-info.json' });
      cy.intercept('GET', apiUrl('/Partitions/guidID/$/GetServiceName?*'), { fixture: 'cluster-page/upgrade/get-service-name.json' });
      cy.intercept('GET', apiUrl('/Services/VisualObjectsApplicationType~VisualObjects.ActorService/$/GetApplicationName?*'), { fixture: 'cluster-page/upgrade/get-application-info.json' }).as('appinfo');
    })

    describe('health check', () => {
      const donePhaseRef = '[data-cy=donephase]';

      const checkPhase = (currentPhase, phasetimeLeft, elapsedTime, durationLeft, checkFailed = false) => {
        cy.get(`[data-cy=${checkFailed ? 'failed' : 'in-progress'}phase]`).within(() => {
          cy.contains(currentPhase)
        });

        cy.get('[data-cy=timeleft]').within(() => {
          cy.contains(phasetimeLeft)
        })

        cy.get('[data-cy=duration]').within(() => {
          cy.contains(elapsedTime);
          cy.contains(durationLeft);
        })
      }

      it('health policy', () => {
        //Wait Duration
        cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/health-checks/wait-duration.json' }).as("inprogres");
        cy.visit('/#/details')

        checkPhase("Wait Duration - 10 seconds", "10 seconds", 'Wait Time Elapsed : 5 seconds', 'Wait Time Duration Left : 5 seconds' );

        //Stable duration
        cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/health-checks/stable-duration.json' }).as("stable");
        refresh();
        cy.wait('@stable');

        cy.get(donePhaseRef).within(() => {
          cy.contains("Wait Duration - 10 seconds")
        });
        checkPhase("Stable Duration Check - 5 seconds", "2 seconds", 'Stable Time Elapsed : 3 seconds', 'Stable Time Duration Left : 2 seconds' );
        cy.get('[data-cy=flips]').should('not.exist')

        //Retry duration
        cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/health-checks/retry-duration.json' }).as("retry");
        refresh();
        cy.wait('@retry');
        checkPhase("Retry Duration Check - 5:00 minutes",
                   "5 seconds once stable",
                   'Retry Time out Elapsed : 6 seconds',
                   'Retry Time Duration Left : 4:54 minutes',
                   true );

        cy.get('[data-cy=flips]').within(() => {
          cy.contains("1");
        })
      })
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

      cy.get('[data-cy=manualmode]').should('not.exist')

      cy.get('[data-cy=upgradeHealthEvents]').within(() => {
        checkTableSize(4);
      })

      cy.get('[data-cy=healthmonitoring]').should('not.exist');
    })

    it('xss', () => {

      addDefaultFixtures(xssPrefix);

      watchForAlert(() => {
        cy.visit('/#/details')
      })
    });

    it('upgrade in progress - manual mode', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/manual-mode-upgrade.json' }).as("upgrade");
      cy.visit('/#/details')

      cy.wait("@upgrade")

      cy.get('[data-cy=manualmode]').should('exist')
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
      cy.get('[data-cy=healthmonitoring]').should('not.exist');
    })

    it('upgrade in progress - no auto load safety checks', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/upgrade-in-progress-many-safety-checks.json' }).as("inprogres");

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.contains("2020-08-25T18:09:10.960Z");

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

    it('failed upgrade', () => {
      cy.intercept('GET', upgradeProgress_route, { fixture: 'cluster-page/upgrade/failed-upgrade.json' }).as("inprogres");

      cy.visit('/#/details')

      cy.wait("@inprogres")

      cy.get('[data-cy=failedupgrade]').within(() => {

        cy.get('[data-cy=failureoverview]').within(() => {
          cy.contains('UpgradeDomainTimeout');
          cy.contains('2022-03-10T16:13:59.906Z');
        })

        cy.get('[data-cy=failedud]').within(() => {
          cy.contains('b-hrs-1_2');
          cy.get('[data-cy=failedphase]')
        })
      })
      cy.get('[data-cy=healthmonitoring]').should('not.exist');

    })

    it('upgrade completed', () => {
      cy.visit('/#/details')

      cy.wait(FIXTURE_REF_UPGRADEPROGRESS)
      cy.contains('Latest Cluster Upgrade')
    })


  })

  describe("metrics", () => {
    const visit = () => {
      const url = "/#/metrics";
      const waitUrl = "@nodeLoad";
      cy.visit(url)
      cy.wait(waitUrl);
    }
    it('load metrics', () => {
      cy.intercept('GET', nodes_route, { fixture: 'cluster-page/nodes-1-warning.json' })
      cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), { fixture: 'node-load/get-node-load-information.json' }).as("nodeLoad")
      cy.intercept(apiUrl('/Nodes/_nt_0/$/GetHealth?EventsHealthStateFilter=0&api-version=3.0'), { fixture: 'cluster-page/node-health.json' }).as('getnodeHealth')

      visit();

      cy.get('app-metrics').within(() => {
        cy.contains("Reserved CpuCores");
      })
    })

    it('xss', () => {
      cy.intercept('GET', nodes_route, { fixture: 'cluster-page/nodes-1-warning.json' })
      cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), { fixture: 'node-load/get-node-load-information.json' }).as("nodeLoad")
      cy.intercept(apiUrl('/Nodes/_nt_0/$/GetHealth?EventsHealthStateFilter=0&api-version=3.0'), { fixture: 'cluster-page/node-health.json' }).as('getnodeHealth')

      addDefaultFixtures(xssPrefix);

      watchForAlert(() => {
        visit();
      })
    });
  })

  describe("clustermap", () => {
    const url = '/#/clustermap';
    it('load clustermap', () => {
      const checkNodes = (ref, expectedCount) => {

        let count = 0;
        cy.get(ref).each(item => {
          if (item.text().trim() !== "0") {
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

      cy.visit(url)

      checkNodes(down_node_ref, 0);

      cy.intercept('GET', nodes_route, { fixture: 'cluster-page/clustermap/nodes.json' })

      refresh();
      cy.wait(FIXTURE_REF_NODES);
      cy.wait(200)

      checkNodes(down_node_ref, 2);

      cy.get('[data-cy=clustermap-container]').within(() => {

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

    it('xss', () => {
      addDefaultFixtures(xssPrefix);

      watchForAlert(() => {
        cy.visit(url)
      })
    });

  })

  describe("image store", () => {
    const waitRef = 'baseDirectory';
    const url = '/#/imagestore';

    const visit = () => {
      cy.visit(url)
      cy.wait('@get' + waitRef)
    }
    it('load image store', () => {
      addRoute(waitRef, 'cluster-page/imagestore/base-directory.json', apiUrl('/ImageStore?*'))
      addRoute('nestedDictectory', 'cluster-page/imagestore/nested-directory.json', apiUrl('/ImageStore/StoreTest?*'))
      addRoute('loadSize', 'cluster-page/imagestore/load-size.json', apiUrl('/ImageStore/Store/VisualObjectsApplicationType/$/FolderSize?*'))

      visit();

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
    const visit = () => {
      cy.visit('/#/manifest');
      cy.wait(FIXTURE_REF_MANIFEST);
    }
    it('load manifest page', () => {

      visit();

      cy.get('app-manifest-viewer').within(() => {
        cy.contains("WRP_Generated_ClusterManifest");
      })
    })

    it('xss', () => {
      addDefaultFixtures(xssPrefix);

      watchForAlert(() => {
        visit();
      })
    });
  })

  describe("back up restore", () => {
    it('load  page and create', () => {
      addRoute('loadBRS', 'backup-restore/backup-policy.json', apiUrl('/BackupRestore/BackupPolicies/?*'))

      cy.visit('/#/backups')

      checkTableSize(1);
    })

    describe("create", () => {
      const createBRS = "createBRS";
      const aliasedCreateBRS = "@" + createBRS;

      const submitButton = "[data-cy=submit]";

      //form properties
      const name = "newbrs";
      const maxIncBackups = 2;
      const interval = "PT15M";

      beforeEach(() => {
        cy.intercept('POST', apiUrl(`/BackupRestore/BackupPolicies/$/Create?*`), { statusCode: 200 }).as(createBRS)

        cy.visit('/#/backups')

        cy.contains('Backup Actions').click();
        cy.contains(" Create Backup Policy ").click();

        //fill in the form
        cy.get("[formcontrolname=Name]").type(name);
        cy.get("[formcontrolname=MaxIncrementalBackups]").type(maxIncBackups);
        cy.get("[formcontrolname=Interval]").type(interval);
      })

      it('create by AzureBlobStore - toggle autoRestoreOnDataLoss', () => {
        cy.get("[formcontrolname=ConnectionString]").type("constring");
        cy.get("[formcontrolname=AutoRestoreOnDataLoss]").click();

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)

        cy.get(aliasedCreateBRS).its('request.body')
          .should('deep.equal', {
            "Name": name,
            "AutoRestoreOnDataLoss": true,
            "MaxIncrementalBackups": maxIncBackups,
            "Schedule": {
              "ScheduleKind": "FrequencyBased",
              "ScheduleFrequencyType": "",
              "RunDays": [],
              "RunTimes": [],
              "Interval": "PT15M"
            },
            "Storage": {
              "StorageKind": "AzureBlobStore",
              "FriendlyName": "",
              "Path": "",
              "ConnectionString": "constring",
              "ContainerName": "",
              "BlobServiceUri": "",
              "ManagedIdentityType": "",
              "ManagedIdentityClientId": "",
              "PrimaryUserName": "",
              "PrimaryPassword": "",
              "SecondaryUserName": "",
              "SecondaryPassword": ""
            }
          })
      })


      it('create by ManagedIdentityAzureBlobStore', () => {
        cy.get("[value=ManagedIdentityAzureBlobStore]").click();

        cy.get("[formcontrolname=BlobServiceUri]").type("BSUURI");
        cy.get("[formcontrolname=ContainerName]").type("sillycontainername");
        cy.get("[formcontrolname=ManagedIdentityClientId]").type("sillyclientid");
        cy.get("[value=Cluster]").click();

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)

        cy.get(aliasedCreateBRS).its('request.body')
          .should('deep.equal', {
            "Name": name,
            "AutoRestoreOnDataLoss": false,
            "MaxIncrementalBackups": maxIncBackups,
            "Schedule": {
              "ScheduleKind": "FrequencyBased",
              "ScheduleFrequencyType": "",
              "RunDays": [],
              "RunTimes": [],
              "Interval": interval
            },
            "Storage": {
              "StorageKind": "ManagedIdentityAzureBlobStore",
              "FriendlyName": "",
              "Path": "",
              "ConnectionString": "",
              "ContainerName": "sillycontainername",
              "BlobServiceUri": "BSUURI",
              "ManagedIdentityType": "Cluster",
              "ManagedIdentityClientId": "sillyclientid",
              "PrimaryUserName": "",
              "PrimaryPassword": "",
              "SecondaryUserName": "",
              "SecondaryPassword": ""
            }
          })
      })


      it('create by FileShare - time based', () => {
        cy.get("[value=TimeBased]").click();
        cy.get("[value=Weekly]").click();
        cy.contains("Monday").click();
        cy.contains("Tuesday").click();
        cy.contains("Saturday").click();

        //untoggle
        cy.contains("Monday").click();

        cy.get("[value=FileShare]").click();
        cy.get("[formcontrolname=Path]").type("somePath")
        cy.get("[formcontrolname=PrimaryUserName]").type("username")
        cy.get("[formcontrolname=PrimaryPassword]").type("password")

        cy.get("[formcontrolname=IsEmptySecondaryCredential]").click();

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)
        cy.get(aliasedCreateBRS).its('request.body').should('deep.equal',
          {
            "Name": name,
            "AutoRestoreOnDataLoss": false,
            "MaxIncrementalBackups": maxIncBackups,
            "Schedule": {
              "ScheduleKind": "TimeBased",
              "ScheduleFrequencyType": "Weekly",
              "RunDays": [
                "Tuesday",
                "Saturday"
              ],
              "RunTimes": [],
              "Interval": "PT15M"
            },
            "Storage": {
              "StorageKind": "FileShare",
              "FriendlyName": "",
              "Path": "somePath",
              "ConnectionString": "",
              "ContainerName": "",
              "BlobServiceUri": "",
              "ManagedIdentityType": "",
              "ManagedIdentityClientId": "",
              "PrimaryUserName": "username",
              "PrimaryPassword": "password",
              "SecondaryUserName": "",
              "SecondaryPassword": ""
            }
          })
      })

    })

  })
  describe("events", () => {
    const setup = (fileCluster, fileTasks) => {
      addRoute('events', fileCluster, apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('repairs', fileTasks, repairTask_route)

      cy.visit('/#/events')

      cy.wait(['@getevents', '@getrepairs'])
    };

    it("naming", () => {
      addRoute('events', 'empty-list.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('events', 'cluster-page/naming/naming-partitions.json', apiUrl(`/Applications/System/$/GetServices/System%2FNamingService/$/GetPartitions?*`))
      addRoute('events', 'cluster-page/naming/naming-partition-1000.json', apiUrl(`/EventsStore/Partitions/00000000-0000-0000-0000-000000001000/$/Replicas/Events?*`))
      cy.visit('/#/')

      cy.get('[data-cy=navtabs]').within(() => {
        cy.contains('naming').click();
      })

      cy.wait('@getevents');
      cy.url().should('include', 'naming');

      cy.get('[data-cy=metric]').should('have.length', 3);
      cy.get("[class=highcharts-point]").should('have.length', 12);

      cy.get('[data-cy=overviewpanel]').should('have.length', 1).first().within(() => {
        cy.contains("Total Volume: 78887");
        cy.contains("1000").click();
      })
      //toggle data set
      cy.get("[class=highcharts-point]").should('have.length', 0);
    })

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
       
      cy.contains("Why is data missing?").within(()=> {
        cy.get('span[class=mif-info]').should('have.attr', 'tabindex', '0').and('have.attr', 'aria-label');
      });

    })

    it("repair manager disabled", () => {
      addRoute('events', 'empty-list.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('repair-manager-manifest', 'manifestRepairManagerDisabled.json', manifest_route)

      cy.visit('/#/events')
      cy.wait(['@getevents', '@getrepair-manager-manifest'])

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
        cy.get('[type=checkbox]').eq(1).check({ force: true })
      })

      cy.get(EVENT_TABS).within(() => {
        cy.contains(REPAIR_TASK_TAB_NAME).click();
      })
      checkTableSize(6);
    })

    it("failed request", () => {
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

      cy.wait(["@getrepairs", FIXTURE_REF_APPTYPES])
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
          cy.get('button').first().click();
        });

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : Done');
          cy.contains('Restoring : Done');
        })
      });

      cy.get('[data-cy=health-checks').within(() => {
        cy.contains(/Perform Preparing Health Check * Yes/);
        cy.contains(/Perform Restoring Health Check * No/);
      })
    })

    it('view duration graph', () => {
      setup('cluster-page/repair-jobs/simple.json')

      cy.contains("Duration Graph").click();

      cy.wait(1000)
      cy.get('[class=highcharts-point]').should('have.length', 21)
    })

    it('view in progress repair job - stuck in approving', () => {
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
          cy.get('button').first().click();
        });

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : In Progress');
          cy.contains('Restoring : Not Started');
          cy.contains('2020-06-10T00:13:55.675Z');
        })
      });

    })

    it('view in progress repair job - stuck in health check', () => {
      setup('cluster-page/repair-jobs/stuck-in-health-check.json')

      cy.contains("node_1:Restart");

      cy.get('[data-cy=pendingjobs]').within(() => {
        cy.get('tbody > tr').eq(1).within(() => {
          cy.get('button').first().click();
        });

        cy.get('[data-cy=node-stuck-warning]')

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : In Progress');
          cy.contains('Executing : Not Started');
          cy.contains('Restoring : Not Started');
        })

        cy.get('tbody > tr').eq(1).within(() => {
          cy.get('button').first().click();
        });

        cy.get('tbody > tr').eq(0).within(() => {
          cy.get('button').first().click();
        });

        cy.get('[data-cy=node-stuck-warning]')

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : Done');
          cy.contains('Restoring : In Progress');
        })
      });
    })
  })

  describe("systemService - infraservice", () => {
    beforeEach(() => {
      addDefaultFixtures();


    })

    it('executing job', () => {
      addRoute("infra-service-data", "system-service/infrastructure-data.json", apiUrl(`/$/InvokeInfrastructureQuery?api-version=6.0&Command=GetJobs&ServiceId=System/InfrastructureService/Type134*`))
      addRoute("infra-service-data", "empty-list.json", apiUrl(`/$/InvokeInfrastructureQuery?api-version=6.0&Command=GetJobs&ServiceId=System/InfrastructureService/Type135*`))
      addRoute(FIXTURE_REF_SYSTEMAPPS, 'cluster-page/infra/systemServicesWithInfra.json', systemApps_route)


      cy.visit(`/#/infrastructure`)
      cy.get('[data-cy=navtabs]').within(() => {
        cy.contains('infrastructure jobs').click();
      })

      cy.get('[data-cy=444703f2-0733-4537-9cf0-4a543ca12e91]').within(() => {
        cy.get('[data-cy=overview]').within(() => {
          cy.contains(' _primaray_0:ConfigurationUpdate ')
          cy.contains('Acknowledged')
        })
      })

      cy.get('[data-cy=completed]').click();

      cy.contains('FFFFFFF')

      cy.get('[data-cy=throttled]')

      //make sure both infra show up
      cy.get('[data-cy="fabric:/System/InfrastructureService/Type135"]')
      cy.get('[data-cy="fabric:/System/InfrastructureService/Type134"]').within(() => {
        cy.contains('Active : 1')
      })

    })

    describe('banners infrastructure service', () => {
      const bannerText = "Nodetype worker is deployed with less than 5 VMs.";

      beforeEach(() => {
        addRoute("infra-service-data", "empty-list.json", apiUrl(`/$/InvokeInfrastructureQuery?api-version=6.0&Command=GetJobs&ServiceId=System/InfrastructureService/**`))
      })

      describe('Coordinated', () => {
        it('coordinated guid', () => {
          addRoute(FIXTURE_REF_SYSTEMAPPS, 'system-service/coordinated-infra-guid.json', systemApps_route)
          cy.visit(`/#/infrastructure`)

          cy.contains(bannerText).should('not.exist')
        })
      })

      describe('cross AZ', () => {
        beforeEach(() => {
          addRoute(FIXTURE_REF_SYSTEMAPPS, 'system-service/cross-az-infra.json', systemApps_route)
        })

        it('5 nodes of one nodetype - ', () => {
          cy.intercept('GET', nodes_route, { fixture: 'system-service/cross-az-nodes.json' })

          cy.visit(`/#/infrastructure`)

          cy.get('[data-cy=navtabs]').within(() => {
            cy.contains('infrastructure jobs').click();
          })

          cy.contains(bannerText).should('not.exist')
        })

        it('< 5 nodes of one node type - cross AZ', () => {
          cy.intercept('GET', nodes_route, { fixture: 'system-service/cross-az-nodes-4.json' })

          cy.visit(`/#/infrastructure`)

          cy.get('[data-cy=navtabs]').within(() => {
            cy.contains('infrastructure jobs').click();
          })

          cy.contains(bannerText)
        })
      })

    })
  })

  describe("commands", () => {
    beforeEach(() => {
      cy.visit('');

      cy.wait(FIXTURE_REF_CLUSTERHEALTH)
    })

    it('view commands', () => {
      checkCommand(3, 1);
    })

    it('check command input', () => {

      cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('commands').click();
      });

      cy.url().should('include', 'commands');

      cy.wait(500);

      cy.get('[data-cy=commandNav]').within(() => {
        cy.contains('Unsafe Commands').click();
      })

      cy.get('[data-cy=submit]').click();
      cy.wait(500);

      cy.get('[data-cy=command]').within(() => {
        cy.get('.detail-pane').should('have.class', 'unsafe')
        cy.get('[data-cy=requiredInput]').should('have.length', 3)
        cy.get('[data-cy=optionalInput]').should('have.length', 0)
        cy.get('[data-cy=warning]').should('include.text', 'HealthState, SourceId, HealthProperty')
        cy.get('[data-cy=clipboard]').get('button').should('be.disabled')
        cy.get('[data-cy=copy-text]').should('have.text', ' Send-ServiceFabricClusterHealthReport  ')

        cy.contains('Optional Parameters').click()
        cy.get('[data-cy=optionalInput]').should('have.length', 6)

        cy.contains('HealthState').click().contains('OK').then(btn => {
          cy.wrap(btn).should('have.attr', 'aria-label').and('equal', 'OK 1 of 3')
          cy.wrap(btn).click()
        })
        cy.get('[data-cy=warning]').should('not.include.text', 'HealthState')
        cy.get('[data-cy=copy-text]').should('include.text', '-HealthState  OK')
        cy.contains('HealthState').click().within(() => {
          cy.get('button[value="OK"]').should('have.attr', 'aria-label').and('equal', 'OK selected 1 of 3')
        })
        cy.contains('SourceId').type('id')
        cy.get('[data-cy=warning]').should('not.include.text', 'SourceId')
        cy.get('[data-cy=copy-text]').should('include.text', '-SourceId  "id"')

        cy.contains('HealthProperty').type('property')
        cy.get('[data-cy=warning]').should('not.exist')
        cy.get('[data-cy=copy-text]').should('include.text', '-HealthProperty  "property"')

        cy.get('[data-cy=clipboard]').get('button').should('be.enabled')

        cy.contains('Description').type('description sentence')
        cy.get('[data-cy=copy-text]').should('include.text', '-Description  "description sentence"')

        cy.contains('TimeToLiveSec').type('10')
        cy.get('[data-cy=copy-text]').should('include.text', '-TimeToLiveSec  10')

        cy.contains('RemoveWhenExpired').click()
        cy.get('[data-cy=copy-text]').should('include.text', '-RemoveWhenExpired')

        cy.contains('SequenceNumber').type('99')
        cy.get('[data-cy=copy-text]').should('include.text', '-SequenceNumber  99')

        cy.contains('Immediate').click()
        cy.get('[data-cy=copy-text]').should('include.text', '-Immediate')

        cy.contains('TimeoutSec').type('100')
        cy.get('[data-cy=copy-text]').should('include.text', '-TimeoutSec  10')
      })
    })
  })

})
