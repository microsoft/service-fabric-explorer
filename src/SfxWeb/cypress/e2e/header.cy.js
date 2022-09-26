/// <reference types="cypress" />

import { addDefaultFixtures, refresh, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS } from './util.cy';

context('Header', () => {

    beforeEach(() => {
        addDefaultFixtures();
    })

    describe("refresh rate", () => {
        it('change rate', () => {
            /*
            Use upgrade progress as our "polling" request
            Set refresh to OFF, wait for the first request to kick off
            wait 13 seconds and ensure only request has been sent so far.
            */
            cy.visit('');

            cy.wait(FIXTURE_REF_UPGRADEPROGRESS);

            cy.get('[data-cy=refreshrate]').within(() => {
                cy.contains("Refresh Rate : 10")

                cy.contains('Off').click();
                cy.intercept('GET', upgradeProgress_route, { fixture: 'upgrade-in-progress.json' }).as("record");

                cy.contains("Refresh Rate : Off")

                cy.wait(13000)

                cy.contains("Fast").click();
                cy.contains("Refresh Rate : 5");

                cy.wait("@record");
                cy.get("@record" + '.3').should('not.exist')
            })
        })

    })

    describe("upgrade banner", () => {

        //visit a page which does not refresh upgrade progress as part of the page view.
        it("dont show then show", () => {
            cy.visit('/clustermap');
            cy.get('[data-cy=upgradebanner]').should('not.exist')

            cy.intercept('GET', upgradeProgress_route, { fixture: 'upgrade-in-progress.json' }).as("inprogres");

            refresh();
            cy.wait("@inprogres");

            cy.get('[data-cy=upgradebanner]').should('exist')

        })
    })


})
