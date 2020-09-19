/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_APPTYPES, EMPTY_LIST_TEXT } from './util';

const appName = "VisualObjectsApplicationType";
const serviceName = "VisualObjects.ActorService";
const statefulServiceName = "VisualObjects.WebService";
const waitRequest = "@app";

/*
Default to stateful service for the page

*/
context('service', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.route(apiUrl(`/Applications/${appName}/$/GetServices?*`), "fx:app-page/services").as("services")

    })

    describe("stateful", () => {
        beforeEach(() => {
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetDescription?*`), "fx:service-page/service-description").as("description");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}?*`), "fx:service-page/service-info").as("serviceInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetPartitions?*`), "fx:service-page/service-partitions").as("partitions");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${serviceName}/$/GetHealth?*`), "fx:service-page/service-health").as("health");
        })

        it('load essentials', () => {
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}`)
            cy.wait("@serviceInfo");

            cy.get('[data-cy=header]').within(() => {
                cy.contains(serviceName).click();
            })
        })

        it('stateful information', () => {
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}`)
            cy.wait("@serviceInfo");

            cy.get('[data-cy=stateful]').within(() => {
                cy.contains("Stateful")
                cy.contains("Minimum Replica Set Size")
                cy.contains("Target Replica Set Size")
            })
        })
    })

    describe("stateless", () => {
        beforeEach(() => {
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetDescription?*`), "fx:service-page/service-stateless-description").as("description");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}?*`), "fx:service-page/service-stateless-info").as("serviceInfo");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetPartitions?*`), "fx:service-page/service-stateless-partitions").as("partitions");
            cy.route(apiUrl(`/Applications/${appName}/$/GetServices/${appName}/${statefulServiceName}/$/GetHealth?*`), "fx:service-page/service-health").as("health")
        })

        it('stateless information', () => {
            cy.visit(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${statefulServiceName}`)
            cy.wait("@serviceInfo");
    
            cy.get('[data-cy=stateless]').within(() => {
                cy.contains("Stateless")
                cy.contains("Instance Count")
            })
        })
    })

    // describe("details", () => {
    //     it('view details', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('details').click();
    //         })

    //         cy.url().should('include', '/details')
    //     })
    // })

    // describe("deployments", () => {
    //     it('view details', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('deployments').click();
    //         })

    //         cy.url().should('include', '/deployments')
    //     })
    // })

    // describe("manifest", () => {
    //     it('view manifest', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('manifest').click();
    //         })

    //         cy.url().should('include', '/manifest')
    //     })
    // })

    // describe("backups", () => {
    //     it('view backup', () => {
    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('backup').click();
    //         })

    //         cy.url().should('include', '/backup')
    //     })
    // })

    // describe("events", () => {
    //     it('view events', () => {
    //         cy.route(apiUrl(`EventsStore/Applications/${appName}/$/Events?*`), "fx:empty-list").as("events")

    //         cy.wait(waitRequest);

    //         cy.get('[data-cy=navtabs]').within(() => {
    //             cy.contains('events').click();
    //         })

    //         cy.url().should('include', '/events')
    //     })
    // })

})