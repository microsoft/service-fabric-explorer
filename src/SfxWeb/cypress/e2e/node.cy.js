/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, checkTableSize, FIXTURE_REF_NODES, nodes_route, FIXTURE_NODES, addRoute, checkCommand, xssHtml, partialXssDecoding, OPTION_PICKER, CLUSTER_TAB_NAME, SELECT_EVENT_TYPES, renderedSanitizedXSS, xssPrefix, watchForAlert, unsanitizedXSS } from './util.cy';

const nodeName = "_nt_0"
const nodeInfoRef = "@getnodeInfo"

const seedNodeQuoromRef = '[data-cy=seedNodeQuorom]';

const setup = (node, prefix = "") => {
  addRoute(FIXTURE_NODES, prefix +"node-page/Ok-nodes-list.json", nodes_route);
  addRoute("nodeInfo", prefix+ "node-page/node-info.json", apiUrl(`/Nodes/${node}/?api-version=3.0`));
  addRoute("nodehealthInfo", prefix + "node-page/health.json", apiUrl(`/Nodes/${node}/$/GetHealth?*`));
  addRoute("apps", prefix + "node-page/apps.json", apiUrl(`/Nodes/${node}/$/GetApplications?*`));
  addRoute("nodeLoad", prefix + "node-load/get-node-load-information.json", apiUrl(`/Nodes/${node}/$/GetLoadInformation?*`));
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
        })

        cy.get('[data-cy=appsList]').within(() => {
          checkTableSize(1);
        })

        cy.get('[data-cy=deactivated').should('not.exist');
        cy.get('[data-cy=repair-jobs').should('not.exist');

        cy.get('[data-cy=placementconstraints]').within(() => {
          cy.contains("NodeTypeName : nt")
        })

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
        addRoute(FIXTURE_NODES, "node-page/node-list.json", nodes_route);

        cy.visit(`/#/node/${nodeName}`);

        cy.wait("@getdeactivatedNode");

        cy.get('[data-cy=deactivated]').within(() => {
          cy.contains("86fa6852ad467a903afbbc67edc16b66");
          cy.get(seedNodeQuoromRef).should('not.exist');
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
        addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/${nodeName}/$/Events?*`));

        cy.visit(`/#/node/${nodeName}/events`);

        cy.wait("@getevents");
        cy.url().should('include', 'events');
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


  describe.only("xss" , () => {
    const xssName = "%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E";

    beforeEach(() => {
      setup(encodeURI("**"), "xss/")
    })

    it('essentials/details ', () => {
      addDefaultFixtures(xssPrefix);


      watchForAlert(() => {
        cy.visit(`/#/node/${xssName}`);
      })

      watchForAlert(() => {
        cy.visit(`/#/node/${xssName}/details`);
      })

    })

    it('url payload', () => {

      addDefaultFixtures();

      addRoute('events', 'cluster-page/eventstore/cluster-events.json', apiUrl(`/EventsStore/Cluster/Events?*`))
      addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Nodes/**/$/Events?**`));

      cy.visit(`/#/node/${xssName}/events`);

      cy.get(SELECT_EVENT_TYPES).click()
      cy.get(OPTION_PICKER).within(() => {
        cy.contains(CLUSTER_TAB_NAME)
        cy.get('[type=checkbox]').eq(0).check({ force: true })
      })

      cy.contains(`<img src="1">`)
    })
  })

})
