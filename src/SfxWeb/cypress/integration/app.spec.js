/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, EMPTY_LIST_TEXT, addRoute } from './util';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@getapp";
context('app', () => {
    beforeEach(() => {
        addDefaultFixtures();

        addRoute("upgradeProgress", "app-page/upgrade-progress.json", apiUrl(`/Applications/${appName}/$/GetUpgradeProgress?*`))
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`))
        addRoute("apphealth", "app-page/app-health", apiUrl(`/Applications/${appName}/$/GetHealth?*`))
        addRoute("app", "app-page/app-type.json", apiUrl(`/Applications/${appName}/?*`))
        addRoute("manifest", "app-page/manifest.json", apiUrl(`/Applications/${appName}/$/GetApplicationManifest?*`))
        addRoute(apiUrl("serviceTypes", "app-page/service-types.json", `/Applications/${appName}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*?*`))
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
            cy.wait([waitRequest, "@getapphealth"]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')
        })
    })

    describe("deployments", () => {
        it('view deployments', () => {
            cy.wait([waitRequest, "@getapphealth"]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('deployments').click();
            })
            cy.wait("@getapphealth")
            cy.url().should('include', '/deployments')
        })
    })

    describe("manifest", () => {
        it('view manifest', () => {
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);
            addRoute("appManifest", "app-page/app-manifest.json", apiUrl(`/ApplicationTypes/${appName}/$/GetApplicationManifest?*`))

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('manifest').click();
            })

            cy.wait(["@getappManifest", waitRequest])
            cy.url().should('include', '/manifest')
        })
    })

    describe("backups", () => {
        it('view backup', () => {
            cy.intercept(apiUrl(`/Applications/${appName}/$/GetBackupConfigurationInfo?*`)).as('backup');
            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('backup').click();
            })

            cy.wait("@backup")

            cy.url().should('include', '/backup')
        })
    })

    describe("events", () => {
        it('view events', () => {
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/Applications/${appName}/$/Events?*`))

            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents')
            cy.url().should('include', '/events')
        })
    })

})