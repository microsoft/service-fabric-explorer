/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, EMPTY_LIST_TEXT, addRoute, refresh, aad_route } from './util.cy';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@getapp";
context('app', () => {
    beforeEach(() => {
        addDefaultFixtures();
        addRoute("upgradeProgress", "app-page/upgrade-progress.json", apiUrl(`/Applications/${appName}/$/GetUpgradeProgress?*`))
        addRoute("services", "app-page/services.json", apiUrl(`/Applications/${appName}/$/GetServices?*`))
        addRoute("apphealth", "app-page/app-health.json", apiUrl(`/Applications/${appName}/$/GetHealth?*`))
        addRoute("app", "app-page/app-type.json", apiUrl(`/Applications/${appName}/?a*`))
        addRoute("appParams", "app-page/app-type-excluded-params.json", apiUrl(`/Applications/${appName}/?ExcludeApplicationParameters=true*`))
        addRoute("events", "app-page/app-events.json", apiUrl(`/EventsStore/Applications/${appName}/$/Events?*`))

        addRoute("manifest", "app-page/manifest.json", apiUrl(`/Applications/${appName}/$/GetApplicationManifest?*`))
        addRoute("serviceTypes", "app-page/service-types.json", apiUrl(`/ApplicationTypes/${appName}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*`))
    })

    describe("essentials", () => {
        it('load essentials', () => {
          cy.visit(`/#/apptype/${appName}/app/${appName}`)

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

            cy.contains("ApplicationProcessExited - 1 Events")
        })

        it('upgrade in progress', () => {
          addRoute("upgradeProgress", "app-page/upgrade-in-progress.json", apiUrl(`/Applications/${appName}/$/GetUpgradeProgress?*`))

          cy.visit(`/#/apptype/${appName}/app/${appName}`)

          cy.get('[data-cy=upgradeDetails]').within(() => {
              cy.contains("Upgrade In Progress")

              cy.get('[data-cy=upgrade-bar]').within(() => {
                cy.contains('Upgrade Duration : 81 milliseconds')
              })

              cy.get('[data-cy=upgrade-bar-domain]').within(() => {
                cy.contains('81 milliseconds')
              })
          })
      })

    })

    describe("details", () => {
        const param = "Parameters"

        it('view details', () => {
          cy.visit(`/#/apptype/${appName}/app/${appName}`)

            cy.wait([waitRequest, "@getapphealth"]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')

            cy.contains(param).should('exist')
        })

      it('view details - no params', () => {
        cy.intercept('GET', aad_route,
          {
            fixture: "aad.json", headers: {
              'sfx-readonly': '1'
            }
          })

        cy.visit(`/#/apptype/${appName}/app/${appName}`)

        cy.wait(["@getappParams", "@getapphealth"]);

        cy.get('[data-cy=navtabs]').within(() => {
          cy.contains('details').click();
        })

        cy.url().should('include', '/details')
        cy.contains(param).should('not.exist')
      })
    })

    describe("deployments", () => {
        it('view deployments', () => {
          cy.visit(`/#/apptype/${appName}/app/${appName}`)

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
          cy.visit(`/#/apptype/${appName}/app/${appName}`)

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
          cy.visit(`/#/apptype/${appName}/app/${appName}`)

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
            cy.visit(`/#/apptype/${appName}/app/${appName}`)

            cy.wait([waitRequest, FIXTURE_REF_MANIFEST]);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents')
            cy.url().should('include', '/events')
        })
    })

})
