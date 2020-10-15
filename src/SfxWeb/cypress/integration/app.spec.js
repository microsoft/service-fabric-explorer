/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, EMPTY_LIST_TEXT } from './util';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@app";
context('app', () => {
    beforeEach(() => {
        cy.server()
        addDefaultFixtures();

        cy.route(apiUrl(`/Applications/${appName}/$/GetUpgradeProgress?*`), "fx:app-page/upgrade-progress").as("upgradeProgress")
        cy.route(apiUrl(`/Applications/${appName}/$/GetServices?*`), "fx:app-page/services").as("services")
        cy.route(apiUrl(`/Applications/${appName}/$/GetHealth?*`), "fx:app-page/app-health").as("apphealth")
        cy.route(apiUrl(`/Applications/${appName}/?*`), "fx:app-page/app-type").as("app")
        cy.route(apiUrl(`ApplicationTypes/${appName}/$/GetApplicationManifest?*`), "fx:app-page/manifest").as("manifest")
        cy.route(apiUrl(`ApplicationTypes/${appName}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*`), "fx:app-page/service-types").as("serviceTypes")
        cy.visit(`/#/apptype/${appName}/app/${appName}`)
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.wait(waitRequest);
            cy.get('[data-cy=header').within(() => {
                cy.contains(appName).click();
            })

            cy.get('[data-cy=upgradeDetails]').within(() => {
                cy.contains("Latest Upgrade State")
            })

            cy.get('[data-cy=health]').within(() => {
                cy.contains(EMPTY_LIST_TEXT)
            })

            cy.get('[data-cy=serviceTypes]').within(() => {
                cy.contains("VisualObjects.WebServiceType");
                cy.contains("VisualObjects.ActorServiceType");

            })

            cy.get('[data-cy=services]').within(() => {
                cy.contains("fabric:/VisualObjectsApplicationType/VisualObjects.WebService");
                cy.contains("fabric:/VisualObjectsApplicationType/VisualObjects.ActorService");
            })
        })

    })

    describe("details", () => {
        it('view details', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.wait("@apphealth")

            cy.url().should('include', '/details')
        })
    })

    describe("deployments", () => {
        it('view deployments', () => {
            cy.wait(waitRequest);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('deployments').click();
            })

            cy.wait(waitRequest);
            cy.url().should('include', '/deployments')
        })
    })

    describe("manifest", () => {
        it('view manifest', () => {
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);
            cy.route(apiUrl(`/ApplicationTypes/${appName}/$/GetApplicationManifest?*`), "fx:app-page/app-manifest").as("appManifest")

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('manifest').click();
            })

            cy.wait("@appManifest")
            cy.url().should('include', '/manifest')
        })
    })

    describe("backups", () => {
        it('view backup', () => {
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);
            cy.route(apiUrl(`/Applications/${appName}/$/GetBackupConfigurationInfo?*`)).as('backup');

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('backup').click();
            })

            cy.wait("@backup")

            cy.url().should('include', '/backup')
        })
    })

    describe("events", () => {
        it('view events', () => {
            cy.route(apiUrl(`EventsStore/Applications/${appName}/$/Events?*`), "fx:empty-list").as("events")

            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@events')
            cy.url().should('include', '/events')
        })
    })

})