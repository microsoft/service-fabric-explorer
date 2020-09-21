/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST } from './util';

const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorService";
const statelessServiceName = "VisualObjects.WebService";
const waitRequest = "@serviceInfo";

/*
Default to stateful service for the page
*/

const routeFormatter = (appName, serviceName) => `/Applications/${appName}/$/GetServices/${appName}/${serviceName}`;
const urlFormatter = (appName, serviceName) => `/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}`;


context('service', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.route(apiUrl(`/Applications/${appName}/$/GetServices?*`), "fx:app-page/services").as("services")

    })

    describe("stateful", () => {
        beforeEach(() => {
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/$/GetDescription?*`), "fx:service-page/service-description").as("description");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}?*`), "fx:service-page/service-info").as("serviceInfo");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/$/GetPartitions?*`), "fx:service-page/service-partitions").as("partitions");
            cy.route(apiUrl(`${routeFormatter(appName, serviceName)}/$/GetHealth?*`), "fx:service-page/service-health").as("health");

            cy.visit(urlFormatter(appName, serviceName))
        })

        it('load essentials', () => {
            cy.wait("@serviceInfo");

            cy.get('[data-cy=header]').within(() => {
                cy.contains(serviceName).click();
            })
        })

        it('stateful information', () => {
            cy.wait("@serviceInfo");

            cy.get('[data-cy=stateful]').within(() => {
                cy.contains("Stateful")
                cy.contains("Minimum Replica Set Size")
                cy.contains("Target Replica Set Size")
            })
        })

        it('actions', () => {
            cy.wait("@serviceInfo");

            cy.get('[data-cy=actions]').within(() => {
                cy.contains("ACTIONS").click();
                cy.contains("Delete Service")
            })
        })

        it('view details', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
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
            cy.route(apiUrl(`*/$/Events?*`), "fx:empty-list").as("events")

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
    })

    describe("stateless", () => {
        beforeEach(() => {
            cy.route(apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetDescription?*`), "fx:service-page/service-stateless-description").as("description");
            cy.route(apiUrl(`${routeFormatter(appName, statelessServiceName)}?*`), "fx:service-page/service-stateless-info").as("serviceInfo");
            cy.route(apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetPartitions?*`), "fx:service-page/service-stateless-partitions").as("partitions");
            cy.route(apiUrl(`${routeFormatter(appName, statelessServiceName)}/$/GetHealth?*`), "fx:service-page/service-health").as("health")

            cy.visit(urlFormatter(appName, statelessServiceName))
        })

        it('stateless information', () => {
            cy.wait("@serviceInfo");

            cy.get('[data-cy=stateless]').within(() => {
                cy.contains("Stateless")
                cy.contains("Instance Count")
            })
        })

        it('actions', () => {
            cy.wait("@serviceInfo");

            cy.get('[data-cy=actions]').within(() => {
                cy.contains("ACTIONS").click();
                cy.contains("Delete Service")
                cy.contains("Scale Service")
            })
        })

        it('can not view backup', () => {
            cy.wait(FIXTURE_REF_MANIFEST);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('backup').should('not.exist');
            })
        })
    })
})