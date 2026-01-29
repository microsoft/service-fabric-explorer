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
            "QuickRecovery": "Disabled",
            "CompressionType": "CLUSTER_DEFINED",
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


      it('create by AzureBlobStore - drop down QuickRecovery', () => {
        cy.get("[formcontrolname=ConnectionString]").type("constring");
        cy.get("[formcontrolname=QuickRecovery]").select("FromPrimary");

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)

        cy.get(aliasedCreateBRS).its('request.body')
          .should('deep.equal', {
            "Name": name,
            "AutoRestoreOnDataLoss": false,
            "MaxIncrementalBackups": maxIncBackups,
            "QuickRecovery": "FromPrimary",
            "CompressionType": "CLUSTER_DEFINED",
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


      it('create by AzureBlobStore - dropdown CompressionType is ZSTANDARD', () => {
        cy.get("[formcontrolname=ConnectionString]").type("constring");
        cy.get("[formcontrolname=CompressionType]").select("ZSTANDARD");

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)

        cy.get(aliasedCreateBRS).its('request.body')
          .should('deep.equal', {
            "Name": name,
            "AutoRestoreOnDataLoss": false,
            "MaxIncrementalBackups": maxIncBackups,
            "QuickRecovery": "Disabled",
            "CompressionType": "ZSTANDARD",
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

      it('create by AzureBlobStore - dropdown CompressionType is ZIP', () => {
        cy.get("[formcontrolname=ConnectionString]").type("constring");
        cy.get("[formcontrolname=CompressionType]").select("ZIP");

        cy.get(submitButton).click();

        cy.wait(aliasedCreateBRS)

        cy.get(aliasedCreateBRS).its('request.body')
          .should('deep.equal', {
            "Name": name,
            "AutoRestoreOnDataLoss": false,
            "MaxIncrementalBackups": maxIncBackups,
            "QuickRecovery": "Disabled",
            "CompressionType": "ZIP",
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
            "QuickRecovery": "Disabled",
            "CompressionType": "CLUSTER_DEFINED",
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
            "QuickRecovery": "Disabled",
            "CompressionType": "CLUSTER_DEFINED",
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

    describe("update", () => {
      const updateBRS = "updateBRS";
      const aliasedUpdateBRS = "@" + updateBRS;
      
      // Test policy data that will be used for update tests
      const existingPolicy = {
        "Name": "TestUpdatePolicy",
        "AutoRestoreOnDataLoss": true,
        "MaxIncrementalBackups": 5,
        "CompressionType": "ZIP",
        "QuickRecovery": "FromPrimary",
        "Schedule": {
          "ScheduleKind": "TimeBased",
          "ScheduleFrequencyType": "Weekly",
          "RunDays": ["Monday", "Wednesday", "Friday"],
          "RunTimes": ["0001-01-01T18:00:00", "0001-01-01T22:00:00"],
          "Interval": ""
        },
        "Storage": {
          "StorageKind": "AzureBlobStore",
          "FriendlyName": "TestStorage",
          "Path": "test/path",
          "ConnectionString": "test-connection-string",
          "ContainerName": "test-container",
          "BlobServiceUri": "",
          "ManagedIdentityType": "",
          "ManagedIdentityClientId": "",
          "PrimaryUserName": "",
          "PrimaryPassword": "",
          "SecondaryUserName": "",
          "SecondaryPassword": ""
        },
        "RetentionPolicy": {
          "RetentionPolicyType": "Basic",
          "MinimumNumberOfBackups": 3,
          "RetentionDuration": "P30D"
        }
      };

      beforeEach(() => {
        // Mock the backup policies list with our test policy
        cy.intercept('GET', apiUrl('/BackupRestore/BackupPolicies/?*'), {
          statusCode: 200,
          body: {
            "Items": [existingPolicy],
            "ContinuationToken": null
          }
        }).as('loadBRS');

        // Mock the update API call
        cy.intercept('POST', apiUrl(`/BackupRestore/BackupPolicies/$/Update?*`), { statusCode: 200 }).as(updateBRS);

        // Visit the backup policies page
        cy.visit('/#/backups');
        cy.wait('@loadBRS');
      });

      it('should populate form with existing policy values when clicking Update', () => {
        // Click on the policy name in the table to open view dialog
        // The policy name has a click event that opens the view dialog
        cy.get('td').contains('TestUpdatePolicy').click();
        
        // Click Update Backup Policy button
        cy.contains('Update Backup Policy').click();
        
        // Verify that the form is populated with existing values
        cy.get("[formcontrolname=Name]").should('have.value', 'TestUpdatePolicy');
        cy.get("[formcontrolname=Name]").should('be.disabled'); // Name should be disabled in update mode
        
        cy.get("[formcontrolname=AutoRestoreOnDataLoss]").should('be.checked');
        cy.get("[formcontrolname=MaxIncrementalBackups]").should('have.value', '5');
        cy.get("[formcontrolname=CompressionType]").should('have.value', 'ZIP');
        cy.get("[formcontrolname=QuickRecovery]").should('have.value', 'FromPrimary');
        
        // Verify schedule settings
        cy.get("[value=TimeBased]").should('be.checked');
        cy.get("[value=Weekly]").should('be.checked');
        
        // Verify selected days - the checkbox is inside the label with the day name
        cy.contains("label", "Monday").find('input[type=checkbox]').should('be.checked');
        cy.contains("label", "Tuesday").find('input[type=checkbox]').should('not.be.checked');
        cy.contains("label", "Wednesday").find('input[type=checkbox]').should('be.checked');
        cy.contains("label", "Thursday").find('input[type=checkbox]').should('not.be.checked');
        cy.contains("label", "Friday").find('input[type=checkbox]').should('be.checked');
        cy.contains("label", "Saturday").find('input[type=checkbox]').should('not.be.checked');
        cy.contains("label", "Sunday").find('input[type=checkbox]').should('not.be.checked');
        
        // Verify storage settings
        cy.get("[formcontrolname=ConnectionString]").should('have.value', 'test-connection-string');
        cy.get("[formcontrolname=ContainerName]").should('have.value', 'test-container');
        
        // Verify retention policy
        cy.get("[formcontrolname=retentionPolicyRequired]").should('be.checked');
        cy.get("[formcontrolname=MinimumNumberOfBackups]").should('have.value', '3');
        cy.get("[formcontrolname=RetentionDuration]").should('have.value', 'P30D');
        
        // Verify the button text shows "Update backup policy"
        cy.get("[data-cy=submit]").should('contain.text', 'Update backup policy');
      });
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

    it("event level column displays status", () => {
      // Use fixture with events of all levels: Error, Warning, Resolved, Info
      addRoute('events', 'cluster-page/eventstore/cluster-events-all-levels.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute('repairs', 'empty-list.json', repairTask_route)

      cy.visit('/#/events')
      cy.wait(['@getevents', '@getrepairs'])

      cy.get(EVENT_TABS).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
      })
      
      // Verify Level column header exists and get its index
      cy.get('thead tr th').then($headers => {
        const levelColumnIndex = Array.from($headers).findIndex(header => 
          header.textContent.includes('Level')
        )
        expect(levelColumnIndex).to.be.greaterThan(-1, 'Level column should exist')
        
        // Verify we have 4 events (one for each level)
        cy.get('tbody tr').should('have.length', 4)
        
        // Check each row for the correct level value
        // Row 1: NodeDown event should show "Error"
        cy.get('tbody tr').eq(0).find('td').eq(levelColumnIndex).should('contain.text', 'Error')
        
        // Row 2: ClusterNewHealthReport with Warning HealthState should show "Warning"
        cy.get('tbody tr').eq(1).find('td').eq(levelColumnIndex).should('contain.text', 'Warning')
        
        // Row 3: ClusterNewHealthReport with Ok HealthState should show "Resolved"
        cy.get('tbody tr').eq(2).find('td').eq(levelColumnIndex).should('contain.text', 'Resolved')
        
        // Row 4: ClusterUpgradeCompleted (no Error/Warning/Resolved classification) should show "Info"
        cy.get('tbody tr').eq(3).find('td').eq(levelColumnIndex).should('contain.text', 'Info')
      })
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

  describe("orchestration view", () => {
    beforeEach(() => {
      cy.fixture('cluster-page/orchestration-view/partition-operation-events.json').then((partitionEvents) => {
        partitionEvents.forEach(event => {
          // update timestamp to use yesterday's date but keep the time
          let yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          let eventDate = new Date(event.TimeStamp);
          event.TimeStamp = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), eventDate.getHours(), eventDate.getMinutes(), eventDate.getSeconds()).toISOString();
        })
        cy.intercept('GET', '**/EventsStore/Partitions/**', partitionEvents).as('partitionevents');
      })
    })

    it("opens orchestration view page", () => {
      cy.visit('/#/')
      cy.get('[data-cy=navtabs]').within(() => {
        cy.contains('orchestration view').click();
      })
    });

    it("renders time picker, partition input and stage toggles", () => {
      cy.get("[data-cy=time-picker]").should("exist");
      cy.get("[data-cy=partition-input]").should("exist").and('have.value', '');
      cy.get("[data-cy=confirm-button]").should("exist");
      cy.get("[data-cy=balancing-toggle]").should("exist");
      cy.get("[data-cy=constrain-check-toggle]").should("exist");
      cy.get("[data-cy=orchestration-timeline]").should("not.exist");
      cy.get("[data-cy=event-details]").should("not.exist");
    });

    it("doesn't disaply the timeline when clicking on Confirm with empty partition id", () => {
      cy.get("[data-cy=confirm-button]").click();
      cy.wait(1000);
      cy.get("[data-cy=orchestration-timeline]").should("not.exist");
    });

    it("disaplies the timeline and events when clicking on Confirm with existing partition id", () => {
      cy.get("[data-cy=partition-input]").type("745ab433-dc74-4edb-ac37-ad9cc9a0446d");
      cy.get("[data-cy=confirm-button]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline]").should("exist");
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 4);
      cy.get("[data-cy=event-details]").should("not.exist");
    });

    it("toggles balancing operations", () => {
      cy.get("[data-cy=balancing-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 3);
      cy.get("[data-cy=balancing-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 4);
    });

    it("toggles placement operations", () => {
      cy.get("[data-cy=placement-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 3);
      cy.get("[data-cy=placement-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 4);
    });

    it("toggles constraint check operations", () => {
      cy.get("[data-cy=constrain-check-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 3);
      cy.get("[data-cy=constrain-check-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 4);
    });

    it("toggles other operations", () => {
      cy.get("[data-cy=other-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 3);
      cy.get("[data-cy=other-toggle]").click();
      cy.wait('@partitionevents');
      cy.get("[data-cy=orchestration-timeline] .vis-point").should("have.length", 4);
    });

    it("displays event details when an event is selected", () => {
      cy.get("[data-cy=orchestration-timeline] .vis-point").first().click();
      cy.get("[data-cy=event-details]").should("exist");
      cy.contains("Operation Details");
      cy.contains("Decision Details");
    });
  });

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

    it('filters external repair tasks from action counter and tables', () => {
      setup('cluster-page/repair-jobs/mixed-node-external.json')

      // Verify that only Node repair tasks appear in the Most Common Actions
      cy.get('[data-cy=top]').within(() => {
        // Should show 3 Node-based actions: 2 PlatformUpdate and 1 TenantUpdate
        cy.contains('System.Azure.Job.PlatformUpdate')
        cy.contains('System.Azure.Job.TenantUpdate')
        // Should NOT show External actions
        cy.contains('External.RestartNode').should('not.exist')
        cy.contains('External.ApplicationUpgrade').should('not.exist')
      })

      // Verify only Node repair tasks appear in pending jobs table
      cy.get('[data-cy=pendingjobs]').within(() => {
        cy.get('tbody > tr').first().within(() => {
          cy.get('button').first().click();
        });

        cy.get('[data-cy=history]').within(() => {
          cy.contains('Preparing : Done');
          cy.contains('Executing : In Progress');
          cy.contains('Restoring : Not Started');
          cy.contains('2020-09-20T00:30:59.740Z');
        })
      });

      // Verify only Node repair tasks appear in completed jobs table
      cy.get('[data-cy=completedjobs]').within(() => {
        cy.contains('Completed Repair Tasks').click()
        cy.contains('Azure/PlatformUpdate/00065b20-aa83-4199-877b-a4b51efa8de6/3/616')
        cy.contains('Azure/TenantUpdate/46df1c03-5212-4b8f-98b0-47dfb70744b6/2/612')
        // Should NOT show External repair tasks (neither Action strings nor TaskIds)
        cy.contains('External.RestartNode').should('not.exist')
        cy.contains('IM/Node/').should('not.exist')
        cy.contains('IM/ApplicationUpgrade/').should('not.exist')
      })

      // Verify timeline only shows Node repair tasks
      cy.get('[data-cy=timeline]').should('exist')
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
        describe('Infrastructure Service Document', () => {
        beforeEach(() => {
          addRoute(FIXTURE_REF_SYSTEMAPPS, 'system-service/coordinated-infra-guid.json', systemApps_route)
          addRoute("infrastructure-service-document-data", "system-service/GetCurrentDocFromIS_Response.json", apiUrl(`/$/InvokeInfrastructureQuery?api-version=6.0&Command=GetCurrentDocFromIS&ServiceId=System/InfrastructureService/Coordinated_43c17f19-8f43-4afc-56ca-38e81f6c844b*`))
        })
          it('Infrastructure Service Document test', () => {
          cy.visit(`/#/infrastructure`)
          cy.get('app-infrastructure-docs').find('select.detail-pane').select('fabric:/System/InfrastructureService/Coordinated_43c17f19-8f43-4afc-56ca-38e81f6c844b')
          cy.contains('Received Document').should('be.visible') 
          cy.get('app-infrastructure-docs').find('select.detail-pane').select('None')
          cy.contains('Received Document').should('not.exist') 
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