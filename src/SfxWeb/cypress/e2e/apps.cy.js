/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, addRoute, FIXTURE_REF_APPS, apps_route, EMPTY_LIST_TEXT, refresh, FIXTURE_APPS } from './util';

const appName = "fabric:/VisualObjectsApplicationType";

context('apps list page', () => {

    beforeEach(() => {
        addDefaultFixtures();
        cy.visit('/#/apps')
    })

    describe("essentials", () => {
        it('load essentials', () => {

            cy.get('[data-cy=header').within(() => {
                cy.contains('Applications').click();
            })

            cy.get('[data-cy=appslist]').within(() => {
                cy.contains(appName)
            })
        })

    })

    describe("upgrades in progress", () => {

        it('view upgrades', () => {

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('upgrades in progress').click();
            })

            cy.url().should('include', '/apps/upgrades')

            cy.get("[data-cy=upgradingapps]").within(() => {
                cy.contains(EMPTY_LIST_TEXT);
            })


            addRoute("appUpgrading", "apps-page/upgrading-app.json", apiUrl(`/Applications/VisualObjectsApplicationType/$/GetUpgradeProgress?*`))
            cy.intercept(apps_route, { fixture: 'apps-page/upgrading-apps.json' }).as('appsUpgrading')

            refresh();

            cy.wait("@appsUpgrading");
            cy.wait("@getappUpgrading")
            cy.get("[data-cy=upgradingapps]").within(() => {
                cy.contains(appName);
                cy.contains("12341234");
            })
        })
    })

    describe("events", () => {
        it('view events', () => {
            cy.wait(FIXTURE_REF_APPS);
            addRoute("events", "empty-list.json", apiUrl(`/EventsStore/**`))

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })

            cy.wait('@getevents')
            cy.url().should('include', '/apps/events')
        })
    })

})