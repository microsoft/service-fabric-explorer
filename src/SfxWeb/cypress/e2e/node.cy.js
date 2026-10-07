/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, nodes_route, FIXTURE_NODES, addRoute, checkCommand,
         getNodeThrottlingEvents, getStaleNodeThrottlingStartedEvent, xssPrefix, watchForAlert, xssEncoded, FIXTURE_REF_MANIFEST,
         manifest_route, refresh } from './util.cy';

const nodeName = "_nt_0"
const nodeInfoRef = "@getnodeInfo"

const seedNodeQuoromRef = '[data-cy=seedNodeQuorom]';

const getResourceUsageEvents = (node) => {
  const now = Date.now();
  return [
    {
      Kind: 'FabricProcessResourceUsage',
      NodeName: node,
      CpuUsagePercent: 1.25,
      MemoryRssBytes: 268435456,
      MemoryTotalBytes: 8589934592,
      SampleDurationMs: 120000,
      TimeStamp: new Date(now - 120000).toISOString(),
      EventInstanceId: '00000000-0000-0000-0000-000000000001'
    },
    {
      Kind: 'FabricProcessResourceUsage',
      NodeName: node,
      CpuUsagePercent: 2.5,
      MemoryRssBytes: 536870912,
      MemoryTotalBytes: 8589934592,
      SampleDurationMs: 120000,
      TimeStamp: new Date(now - 60000).toISOString(),
      EventInstanceId: '00000000-0000-0000-0000-000000000002'
    }
  ];
}

const addResourceUsageRoute = (
  node,
  response = getResourceUsageEvents(node),
  alias = 'getResourceUsage'
) => {
  cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${node}/$/Events?*`), request => {
    if (request.query.eventsTypesFilter === 'FabricProcessResourceUsage') {
      request.alias = alias;
      request.reply(response);
    } else {
      request.alias = 'getNodeEvents';
      request.reply([]);
    }
  });
}

const waitForResourceUsage = (alias = 'getResourceUsage') =>
  cy.wait(`@${alias}`)
    .its('request.query.eventsTypesFilter')
    .should('equal', 'FabricProcessResourceUsage');

const setup = (node, prefix = "") => {
  addRoute(FIXTURE_NODES, prefix +"node-page/Ok-nodes-list.json", nodes_route);
  addRoute("nodeInfo", prefix+ "node-page/node-info.json", apiUrl(`/Nodes/${node}/?api-version=3.0*`));
  addRoute("nodehealthInfo", prefix + "node-page/health.json", apiUrl(`/Nodes/${node}/$/GetHealth?*`));
  addRoute("apps", prefix + "node-page/apps.json", apiUrl(`/Nodes/${node}/$/GetApplications?*`));
  addRoute("nodeLoad", prefix + "node-load/get-node-load-information.json", apiUrl(`/Nodes/${node}/$/GetLoadInformation?*`));
  cy.intercept(
    'GET',
    apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'),
    []
  ).as('getResourceUsageCapability');
  addResourceUsageRoute(node);
}

context('node page', () => {
  describe("pages overview", () => {
    beforeEach(() => {
      addDefaultFixtures();
      setup(nodeName)
    })

    describe("essentials", () => {
      it('load essentials', () => {
        cy.visit(`/#/node/${nodeName}`);

        cy.wait(nodeInfoRef);

        cy.get('[data-cy=header]').within(() => {
          cy.contains('_nt_0').click();
        });

        cy.get('[data-cy=tiles]').within(() => {
          cy.contains('6').click();
          cy.contains('2').click();
          cy.contains('5').click();
        });

        cy.get('[data-cy=essential-info').within(() => {
          cy.contains('10.0.0.8');
          cy.contains('Up Time');
          cy.contains('22 days');
        })

        cy.get('[data-cy=status]').within(() => {
          cy.contains('Up');
        })

        cy.get('[data-cy=node-ring-info]').within(() => {
          cy.contains('3');
          cy.contains('fd:/0');
          cy.contains('Yes');
          cy.contains('nt')
        })

        waitForResourceUsage();
        cy.get('[data-cy=resource-usage]').within(() => {
          cy.contains('Fabric.exe Resource Usage');
          cy.contains('CPU Usage');
          cy.contains('2.50%');
          cy.contains('Memory Usage');
          cy.contains('536.9 MB (6.3%)');
          cy.contains('Usage as of:');
          cy.contains('UTC');
        })

        cy.get('[data-cy=appsList]').within(() => {
          checkTableSize(1);
        })

        cy.get('[data-cy=deactivated').should('not.exist');
        cy.get('[data-cy=repair-jobs').should('not.exist');

        cy.get('[data-cy=placementconstraints]').within(() => {
          cy.contains("NodeTypeName : nt")
        })

        cy.get('[data-cy=node-throttling-warning]').should('not.exist');

      })

      it('shows a warning while the node is throttling', () => {
        const startedEvent = getNodeThrottlingEvents([nodeName]).find(event => event.Kind === 'NodeMessageThrottlingStarted');
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`), request => {
          if (request.query.eventsTypesFilter === 'FabricProcessResourceUsage') {
            request.reply(getResourceUsageEvents(nodeName));
          } else {
            request.alias = 'getNodeThrottlingState';
            request.reply([startedEvent]);
          }
        });

        cy.visit(`/#/node/${nodeName}`);

        cy.wait('@getNodeThrottlingState');
  cy.get('@getNodeThrottlingState.all').should('have.length', 1);
        cy.get('[data-cy=node-throttling-warning]').within(() => {
          cy.get('.warning-icon');
          cy.contains('Node is Throttling');
        });
      })

      it('hides the warning after throttling ends', () => {
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`), getNodeThrottlingEvents([nodeName])).as('getNodeThrottlingState');

        cy.visit(`/#/node/${nodeName}`);

        cy.wait('@getNodeThrottlingState');
        cy.get('[data-cy=node-throttling-warning]').should('not.exist');
      })

      it('ignores throttling from a previous node incarnation', () => {
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`), [getStaleNodeThrottlingStartedEvent(nodeName)])
          .as('getStaleNodeThrottlingState');

        cy.visit(`/#/node/${nodeName}`);

        cy.wait('@getStaleNodeThrottlingState');
        cy.get('[data-cy=node-throttling-warning]').should('not.exist');
      })

      it('does not request throttling events when EventStore is disabled', () => {
        let eventRequests = 0;
        cy.fixture('clusterManifest.json').then(manifest => {
          manifest.Manifest = manifest.Manifest.replace('EventStoreService', 'DisabledEventStoreService');
          cy.intercept('GET', manifest_route, manifest).as('getManifestWithoutEventStore');
        });
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`), request => {
          eventRequests++;
          request.reply([]);
        });

        cy.visit(`/#/node/${nodeName}`);

        cy.wait(['@getManifestWithoutEventStore', nodeInfoRef]);
        cy.get('[data-cy=essential-info]');
        cy.then(() => expect(eventRequests).to.equal(0));
      })

      it('hides resource usage when emission has no recent events', () => {
        addResourceUsageRoute(nodeName, []);

        cy.visit(`/#/node/${nodeName}`);

        waitForResourceUsage();
        cy.get('[data-cy=essential-info]');
        cy.get('[data-cy=resource-usage]').should('not.exist');
      })

      it('ignores stale and malformed resource usage events', () => {
        addResourceUsageRoute(nodeName, [
          {
            Kind: 'FabricProcessResourceUsage',
            NodeName: nodeName,
            CpuUsagePercent: 'invalid',
            MemoryRssBytes: 536870912,
            MemoryTotalBytes: 8589934592,
            SampleDurationMs: 120000,
            TimeStamp: new Date().toISOString(),
            EventInstanceId: '00000000-0000-0000-0000-000000000003'
          },
          {
            Kind: 'FabricProcessResourceUsage',
            NodeName: nodeName,
            CpuUsagePercent: 2.5,
            MemoryRssBytes: 536870912,
            MemoryTotalBytes: 8589934592,
            SampleDurationMs: 120000,
            TimeStamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
            EventInstanceId: '00000000-0000-0000-0000-000000000004'
          }
        ]);

        cy.visit(`/#/node/${nodeName}`);

        waitForResourceUsage();
        cy.get('[data-cy=essential-info]');
        cy.get('[data-cy=resource-usage]').should('not.exist');
      })

      it('keeps essentials usable when EventStore is unavailable', () => {
        addResourceUsageRoute(nodeName, { statusCode: 503 });

        cy.visit(`/#/node/${nodeName}`);

        waitForResourceUsage();
        cy.get('[data-cy=essential-info]');
        cy.get('[data-cy=resource-usage]').should('not.exist');
      })

      it('clears resource usage when EventStore becomes unavailable', () => {
        cy.visit(`/#/node/${nodeName}`);

        waitForResourceUsage();
        cy.get('[data-cy=resource-usage]').should('contain', '2.50%');

        addResourceUsageRoute(nodeName, { statusCode: 503 }, 'getResourceUsageFailure');
        refresh();

        waitForResourceUsage('getResourceUsageFailure');
        cy.get('[data-cy=resource-usage]').should('not.exist');
      })

      it('down node', () => {
        addRoute(FIXTURE_NODES, "node-page/Error-nodes-list.json", nodes_route);
        addRoute("nodeInfo", "node-page/Error-node-info.json", apiUrl(`/Nodes/${nodeName}/?*`));

        cy.visit(`/#/node/${nodeName}`);

        cy.get('[data-cy=essential-info').within(() => {
          cy.contains('10.0.0.8');
          cy.contains('Down Time');
          cy.contains('17');
        })

        cy.get('[data-cy=status]').within(() => {
          cy.contains('Down');
        })

      })

      it('deactivated', () => {
        addRoute("deactivatedNode", "node-page/deactivated-node.json", apiUrl(`/Nodes/${nodeName}/?*`));
        addRoute(FIXTURE_NODES, "node-page/deactivated-node-list.json", nodes_route);

        cy.visit(`/#/node/${nodeName}`);

        cy.wait("@getdeactivatedNode");

        cy.get('[data-cy=deactivated]').within(() => {
          cy.contains("86fa6852ad467a903afbbc67edc16b66");
          cy.contains("This is a description").should('have.length', 1);
          cy.get(seedNodeQuoromRef).should('not.exist');
        })
      })

      it('deactivated - no description', () => {
        addRoute("deactivatedNode", "node-page/deactivated-node-seed-node-quorom.json", apiUrl(`/Nodes/${nodeName}/?*`));
        addRoute(FIXTURE_NODES, "node-page/node-list-seed-node-quorom.json", nodes_route);

        cy.visit(`/#/node/${nodeName}`);

        cy.wait("@getdeactivatedNode");

        cy.get('[data-cy=deactivated]').within(() => {
          cy.contains("This is a description").should('not.exist');
        })
      })
      
      it('deactivated - show seed node quorom warning', () => {
        addRoute("deactivatedNode", "node-page/deactivated-node-seed-node-quorom.json", apiUrl(`/Nodes/${nodeName}/?*`));
        addRoute(FIXTURE_NODES, "node-page/node-list-seed-node-quorom.json", nodes_route);

        cy.visit(`/#/node/${nodeName}`);

        cy.wait("@getdeactivatedNode");

        cy.get('[data-cy=deactivated]').within(() => {
          cy.get(seedNodeQuoromRef);
        })
      })

      it('repair jobs', () => {
        addRoute('repairs', 'node-page/repair-jobs.json', apiUrl('/$/GetRepairTaskList?*'))

        cy.visit(`/#/node/${nodeName}`);

        cy.wait("@getrepairs");

        cy.get('[data-cy=repair-jobs]').within(() => {
          cy.contains("Azure/TenantUpdate/441efe72-c74d-4cfa-84df-515b44c89060/4/1555");
        })
      })

    })

    describe("details", () => {
      it('view details', () => {
        cy.visit(`/#/node/${nodeName}`)

        cy.wait([nodeInfoRef, "@getnodehealthInfo"]);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('details').click();
        });

        cy.wait("@getnodeLoad");
        cy.url().should('include', 'details');
        cy.get("[data-cy=load]");
      })
    })

    describe("events", () => {
      it('view events', () => {
        const nodeDownEvent = {
          NodeName: nodeName,
          Kind: 'NodeDown',
          EventInstanceId: '00000000-0000-0000-0000-000000000003',
          TimeStamp: new Date().toISOString(),
          Category: 'StateTransition',
          HasCorrelatedEvents: false
        };
        cy.intercept('GET', apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`), request => {
          request.reply([...getNodeThrottlingEvents([nodeName]), nodeDownEvent]);
          if (!request.query.eventsTypesFilter) {
            request.alias = 'getevents';
          }
        });

        cy.visit(`/#/node/${nodeName}`);

        cy.wait(FIXTURE_REF_MANIFEST);
        cy.wait(1000)
        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('events').click();
        });

        cy.wait("@getevents").then(interception => {
          expect(interception.request.url).not.to.include('eventsTypesFilter');
        });
        cy.url().should('include', 'events');
        cy.contains(`${nodeName} (3)`);
        cy.contains('NodeDown');
        cy.contains('NodeMessageThrottlingStarted');
        cy.contains('NodeMessageThrottlingEnded');
        cy.get('[data-cy=resource-usage-chart]').within(() => {
          cy.contains('No Fabric.exe resource usage events were found in this time range.');
        });
      })

      it('displays Fabric.exe resource usage for the selected time range', () => {
        cy.intercept(
          'GET',
          apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*eventsTypesFilter=FabricProcessResourceUsage*`),
          getResourceUsageEvents(nodeName)
        ).as('getResourceUsageTimeline');

        cy.visit(`/#/node/${nodeName}`);

        cy.wait(nodeInfoRef);
        cy.wait('@getResourceUsageTimeline');
        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('events').click();
        });

        cy.wait('@getResourceUsageTimeline').its('request.url')
          .should('include', 'eventsTypesFilter=FabricProcessResourceUsage');
        cy.get('[data-cy=resource-usage-chart]').within(() => {
          cy.contains('2 samples');
          cy.get('.highcharts-series-0 .highcharts-graph').should('exist');
          cy.get('.highcharts-series-1 .highcharts-graph').should('exist');
        });
      })

      it('omits resource usage when the runtime rejects the event kind', () => {
        let resourceUsageRequests = 0;
        cy.intercept(
          'GET',
          apiUrl('/EventsStore/Nodes/Events?*eventsTypesFilter=FabricProcessResourceUsage*'),
          {
            statusCode: 400,
            body: { Error: { Code: 'E_INVALIDARG' } }
          }
        ).as('getUnsupportedResourceUsageCapability');
        cy.intercept(
          'GET',
          apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*eventsTypesFilter=FabricProcessResourceUsage*`),
          request => {
            resourceUsageRequests++;
            request.reply([]);
          }
        );

        cy.visit(`/#/node/${nodeName}`);

        cy.wait('@getUnsupportedResourceUsageCapability');
        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('events').click();
        });
        cy.get('[data-cy=resource-usage-chart]').should('not.exist');
        cy.then(() => expect(resourceUsageRequests).to.equal(0));
      })

    })

    describe("commands", () => {
      it('view commands', () => {
        cy.visit(`/#/node/${nodeName}`);

        cy.wait([nodeInfoRef, "@getnodehealthInfo"]);

        checkCommand(3, 2);
      })
    })
  })


  describe("xss" , () => {
    beforeEach(() => {
      setup(encodeURI("**"), xssPrefix)
    })

    it('essentials/details ', () => {
      addDefaultFixtures(xssPrefix);


      watchForAlert(() => {
        cy.visit(`/#/node/${xssEncoded}`);
      })

      watchForAlert(() => {
        cy.visit(`/#/node/${xssEncoded}/details`);
      })

    })

    it('url', () => {
      addDefaultFixtures();

      const unsafeNodeName = '<img src="1">';
      cy.intercept('GET', apiUrl(`/EventsStore/Nodes/**/$/Events?**`), getNodeThrottlingEvents([unsafeNodeName])).as('getevents');

      watchForAlert(() => {
        cy.visit(`/#/node/${xssEncoded}/events`);
      });

      cy.wait('@getevents');
      cy.contains(unsafeNodeName);
    })
  })

})
