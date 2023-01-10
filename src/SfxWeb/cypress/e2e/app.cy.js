/// <reference types="cypress" />

import { decode } from 'punycode';
import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, EMPTY_LIST_TEXT, addRoute, aad_route, checkCommand, xssPrefix, watchForAlert, unsanitizedXSS } from './util.cy';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@getapp";

const initializeRoutes = (app, prefix = "") => {
  addDefaultFixtures(prefix);
  addRoute("upgradeProgress", prefix + "app-page/upgrade-progress.json", apiUrl(`/Applications/${app}/$/GetUpgradeProgress?*`))
  addRoute("services", prefix + "app-page/services.json", apiUrl(`/Applications/${app}/$/GetServices?*`))
  addRoute("apphealth", prefix + "app-page/app-health.json", apiUrl(`/Applications/${app}/$/GetHealth?*`))
  addRoute("app", prefix + "app-page/app-type.json", apiUrl(`/Applications/${app}/?a*`))

}

context('app', () => {
    beforeEach(() => {
      initializeRoutes(appName);
      addRoute("appParams", "app-page/app-type-excluded-params.json", apiUrl(`/Applications/${appName}/?ExcludeApplicationParameters=true*`))
      addRoute("events", "app-page/app-events.json", apiUrl(`/EventsStore/Applications/${appName}/$/Events?*`))

      addRoute("manifest", "app-page/manifest.json", apiUrl(`/Applications/${appName}/$/GetApplicationManifest?*`))
      addRoute("serviceTypes", "app-page/service-types.json", apiUrl(`/ApplicationTypes/${appName}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*`))

    })

    describe("essentials", () => {
        const visit = () => {
          cy.visit(`/#/apptype/${appName}/app/${appName}`)
          cy.wait(waitRequest);
        }
        it('load essentials', () => {
            visit();
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

        it('xss', () => {
          addDefaultFixtures(xssPrefix);

          watchForAlert(() => {
            visit();
          })
        });

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
        const visit = (app) => {
          cy.visit(`/#/apptype/${app}/app/${app}`)
          cy.wait([waitRequest, "@getapphealth"]);
        }
        it('view details', () => {
            visit(appName);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })

            cy.url().should('include', '/details')

            cy.contains(param).should('exist')
        })

        // it.only('xss', () => {
        //   const xssName = "%253C%253Cimg%2520src%253D'1'%2520onerror%253D'window.alert%28document.domain%29'%253E";
        //   initializeRoutes("%3C%3Cimg%20src%3D'1'%20onerror%3D'window.alert(document.domain)'%3E", xssPrefix);
        //   initializeRoutes(xssName, xssPrefix);

        //   watchForAlert(() => {
        //     visit(xssName);
        //   })
        // });

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

    describe("commands", () => {
      it('view commands', () => {
        cy.visit(`/#/apptype/${appName}/app/${appName}`)

        cy.wait(waitRequest)

        checkCommand(4, 1);

      })
    })

})
