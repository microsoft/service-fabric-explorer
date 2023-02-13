/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, addRoute, checkCommand } from './util.cy';

const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorService";
const statelessServiceName = "VisualObjects.WebService";
const waitRequest = "@getserviceInfo";

/*
Default to stateful service for the page
*/
const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}`;
const urlFormatter = (appName, serviceName) => `/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}`;


context('service', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.intercept(apiUrl(`/Applications/${appName}/$/GetServices?*`), {fixture: "app-page/services.json"}).as("services")
    })

    describe("stateful", () => {
        beforeEach(() => {
            addRoute("description", "service-page/service-description.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetDescription?*`))
            addRoute("serviceInfo", "service-page/service-info.json", apiUrl(`${routeFormatter(appName, "VisualObjects.ActorService")}?*`))
            addRoute("partitions", "service-page/service-partitions.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetPartitions?*`))
            addRoute("health", "service-page/service-health.json", apiUrl(`${routeFormatter(appName, serviceName)}/$/GetHealth?*`))
            cy.visit(urlFormatter(appName, serviceName))
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
