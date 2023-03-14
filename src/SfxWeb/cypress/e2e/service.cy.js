/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, addRoute, checkCommand } from './util.cy';

const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorService";
const statelessServiceName = "VisualObjects.WebService";
const waitRequest = "@getserviceInfo";

/*
Default to stateful service for the page
*/
const routeFormatter = (app, service) => `/Applications/${app}/$/GetServices/${app}%2F${service}`;
const urlFormatter = (app, service) => `/#/apptype/${app}/app/${app}/service/${app}%252F${service}`;

const urlFormatter2 = (apptype, app, service) => `/#/apptype/${apptype}/app/${app}/service/${app}%252F${service}`;


const setupStatefulService = (app, service, prefix="") => {
  addRoute("description", prefix + "service-page/service-description.json", apiUrl(`${routeFormatter(app, service)}/$/GetDescription?*`))
  // addRoute("serviceInfo", prefix + "service-page/service-info.json", apiUrl(`${routeFormatter(app, service)}?*`))
  addRoute("partitions", prefix + "service-page/service-partitions.json", apiUrl(`${routeFormatter(app, service)}/$/GetPartitions?*`))
  addRoute("health", prefix + "service-page/service-health.json", apiUrl(`${routeFormatter(app, service)}/$/GetHealth?*`))
}

context('service', () => {
  describe("main interactions", () => {
    beforeEach(() => {
      addDefaultFixtures();
      cy.intercept(apiUrl(`/Applications/${appName}/$/GetServices?*`), { fixture: "app-page/services.json" }).as("services")

    })

    describe("stateful", () => {
      beforeEach(() => {
        // addRoute("description", "service-page/service-description.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetDescription?*`))
        // addRoute("serviceInfo", "service-page/service-info.json", apiUrl(`${routeFormatter(appName, "VisualObjects.ActorService")}?*`))
        // addRoute("partitions", "service-page/service-partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetPartitions?*`))
        // addRoute("health", "service-page/service-health.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetHealth?*`))
        setupStatefulService(appName, serviceName);
        cy.visit(urlFormatter(appName, serviceName));
      })

      it('load essentials - no placement constraints', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=header]').within(() => {
          cy.contains(serviceName).click();
        })

        cy.get("[data-cy=placementconstraints]").within(() => {
          cy.contains('No placement constraints defined')
        })
      })

      it('stateful information', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=state-data]').within(() => {
          cy.contains("Stateful")
          cy.contains("Minimum Replica Set Size")
          cy.contains("Target Replica Set Size")
        })
      })

      it('actions', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=actions]').within(() => {
          cy.contains("Actions").click();
          cy.contains("Delete Service")
        })
      })

      it('view details', () => {
        cy.wait(waitRequest);
        cy.wait('@getdescription');

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('details').click();
        })

        cy.get('[data-cy=serviceDescription]').within(() => {
          cy.contains("Auxiliary Replica Count").should('not.exist');
        })

        cy.url().should('include', '/details')
      })

      it('view manifest', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('manifest').click();
        })

        cy.url().should('include', '/manifest')
      })

      it('view events', () => {
        addRoute("events", "empty-list.json", apiUrl(`*/$/Events?*`))

        cy.wait(waitRequest);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('events').click();
        })

        cy.url().should('include', '/events')
      })

      it('view backup', () => {
        cy.wait(FIXTURE_REF_MANIFEST);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('backup').click();
        })

        cy.url().should('include', '/backup')
      })

      it('view commands', () => {
        cy.wait(waitRequest);

        checkCommand(3, 1);

      })
    })

    describe("stateful - with auxiliary replicas", () => {
      beforeEach(() => {
        addRoute("descriptionWithAux", "service-page/service-description-with-aux", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetDescription?*`));
        addRoute("serviceInfo", "service-page/service-info", apiUrl(`${routeFormatter(appName, serviceName)}?*`));
        addRoute("partitions", "service-page/service-partitions", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetPartitions?*`));
        addRoute("health", "service-page/service-health", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetHealth?*`));

        cy.visit(urlFormatter(appName, serviceName))
      })

      it('view details - with auxiliary replicas', () => {
        cy.wait(waitRequest);
        cy.wait("@getdescriptionWithAux");

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('details').click();
        })

        cy.get('[data-cy=serviceDescription]').within(() => {
          cy.contains("Auxiliary Replica Count")
        })

        cy.url().should('include', '/details')
      })

    })

    describe("stateless", () => {
      beforeEach(() => {
        addRoute("description", "service-page/service-stateless-description.json", apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetDescription?*`))
        addRoute("serviceInfo", "service-page/service-stateless-info.json", apiUrl(`${routeFormatter(appName, statelessServiceName)}?*`))
        addRoute("partitions", "service-page/service-stateless-partitions.json", apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetPartitions?*`))
        addRoute("health", "service-page/service-health.json", apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetHealth?*`))

        cy.visit(urlFormatter(appName, statelessServiceName))
      })

      it('stateless information - with placement constraints', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=state-data]').within(() => {
          cy.contains("Stateless")
          cy.contains("Instance Count")
        })

        cy.get("[data-cy=placementconstraints]").within(() => {
          cy.contains('nodetype == "main")')
        })
      })

      it('actions', () => {
        cy.wait(waitRequest);

        cy.get('[data-cy=actions]').within(() => {
          cy.contains("Actions").click();
          cy.contains("Delete Service")
          cy.contains("Scale Service")
        })
      })

      it('action - scale service', () => {
        cy.wait(waitRequest);

        cy.intercept('POST', apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/Update?*`), { statusCode: 200 }).as('updateService')

        cy.get('[data-cy=actions]').within(() => {
          cy.contains("Actions").click();
          cy.contains("Scale Service").click();
        })

        cy.get('[formcontrolname=count').clear().type(2);
        cy.get('[type=submit').click();

        cy.wait('@updateService')

        cy.get('@updateService').its('request.body')
          .should(
            'deep.equal',
            {
              Flags: 1,
              InstanceCount: 2,
              ServiceKind: 1
            }
          )
      })

      it('can not view backup', () => {
        cy.wait(FIXTURE_REF_MANIFEST);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('backup').should('not.exist');
        })
      })
    })
  })

  describe("xss", () => {
    it("essentials/details", () => {
      const xssName = "%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E";

      cy.intercept(apiUrl(`/Applications/${"*window.alert*"}/$/GetServices?*`), { fixture: "xss/service-page/services.json" }).as("services")
      addRoute('test', "xss/" + 'visualObjectsApplicationType.json', apiUrl(`/Applications/${"*window.alert*"}/?*`))

      // const xssName = "%253C%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E"
      const test = "/Applications/%3Cimg%20src%3D'1'%20onerror%3D'window.alert(document.domain)'%3E/$/GetServices/VisualObjectsApplicationType%2F%3Cimg%20src%3D'1'%20onerror%3D'window.alert(document.domain)'%3E?api-version=3.0"
      addDefaultFixtures("xss/");
      setupStatefulService("*window.alert*", "*window.alert*", "xss/");
      addRoute("serviceInfo", "xss/" + "service-page/service-info.json", apiUrl("/Applications/*window.alert*/$/GetServices/*window.alert*?api-version=3.0"))
      addRoute("serviceInfo", "xss/" + "service-page/service-info.json", apiUrl(test))

      // cy.visit(`/#/apptype/${appName}/app/${xssName}/service/${xssName}`);
      cy.visit(`http://localhost:3000/#/apptype/VisualObjectsApplicationType/app/%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E/service/VisualObjectsApplicationType%252F%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E`)
    })
  })
})
