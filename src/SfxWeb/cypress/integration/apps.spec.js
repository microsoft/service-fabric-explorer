/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS, FIXTURE_REF_MANIFEST, FIXTURE_REF_APPS, apps_route, EMPTY_LIST_TEXT, refresh } from './util';

const appName = "fabric:/VisualObjectsApplicationType";

context('apps list page', () => {

    beforeEach(() => {

        cy.server()
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

            cy.get("[data-cy=upgradingapps]").within( () => {
                cy.contains(EMPTY_LIST_TEXT);
            })

            cy.route('GET', apiUrl(`/Applications/VisualObjectsApplicationType/$/GetUpgradeProgress?*`), 'fx:apps-page/upgrading-app').as("appUpgrading");
            cy.route('GET', apps_route, 'fx:apps-page/upgrading-apps').as("appsUpgrading");

            refresh();

            cy.wait("@appsUpgrading");
            cy.wait("@appUpgrading");

            cy.get("[data-cy=upgradingapps]").within( () => {
                cy.contains(appName);
            })
        })
    })

    describe("events", () => {
        it('view events', () => {
            cy.wait(FIXTURE_REF_APPS);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('events').click();
            })
    
            cy.url().should('include', '/apps/events')
        })
    })

})