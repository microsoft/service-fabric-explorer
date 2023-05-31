/// <reference types="cypress" />
import { addDefaultFixtures, apiUrl, FIXTURE_REF_MANIFEST, EMPTY_LIST_TEXT, addRoute, aad_route,
        checkCommand, xssPrefix, watchForAlert, plaintextXSS2, plaintextXSS, xssEncoded, windowAlertText } from './util.cy';

const appName = "VisualObjectsApplicationType";
const waitRequest = "@getapp";

const initializeRoutes = (app, appType, prefix = "") => {
  addDefaultFixtures(prefix);
  addRoute("upgradeProgress", prefix + "app-page/upgrade-progress.json", apiUrl(`/Applications/${app}/$/GetUpgradeProgress?*`))
  addRoute("services", prefix + "app-page/services.json", apiUrl(`/Applications/${app}/$/GetServices?*`))
  addRoute("apphealth", prefix + "app-page/app-health.json", apiUrl(`/Applications/${app}/$/GetHealth?*`))
  addRoute("app", prefix + "app-page/app-type.json", apiUrl(`/Applications/${app}/?a*`))
  addRoute("serviceTypes", prefix + "app-page/service-types.json", apiUrl(`/ApplicationTypes/${appType}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*`))

}

context('app', () => {
    beforeEach(() => {
      initializeRoutes(appName, appName);
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
          initializeRoutes(`*${windowAlertText}*`, appName, xssPrefix);
          addRoute("events", "xss/app-page/app-events.json", apiUrl(`/EventsStore/Applications/**window.alert**/$/Events?**`))
          addRoute('events', 'empty-list.json', apiUrl(`/EventsStore/Cluster/Events?*`))

          watchForAlert(() => {
            cy.visit(`/#/apptype/${appName}/app/${xssEncoded}`)
            cy.contains('16.0.0');
            cy.contains(plaintextXSS);
            cy.contains("VisualObjects." + plaintextXSS2);
          })

          watchForAlert(() => {
            cy.visit(`/#/apptype/${appName}/app/${xssEncoded}/details`);
            cy.contains("VisualObjects.WebService_InstanceCount");
          })

          watchForAlert(() => {
            cy.visit(`/#/apptype/${appName}/app/${xssEncoded}/deployments`);
            cy.contains("VisualObjects.WebService_InstanceCount");
          })

          watchForAlert(() => {
            cy.visit(`/#/apptype/${appName}/app/${xssEncoded}/events`);
            cy.contains(`<img src="1">`);
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
          cy.get('[data-cy=flips]').should('not.exist')

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
