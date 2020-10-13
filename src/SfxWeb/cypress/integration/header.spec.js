/// <reference types="cypress" />

import { addDefaultFixtures, refresh, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS } from './util';

context('Header', () => {

    beforeEach(() => {
        cy.server()
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
                cy.contains("REFRESH RATE 10")

                cy.contains('OFF').click();
                cy.route('GET', upgradeProgress_route, 'fixture:upgrade-in-progress').as("record");

                cy.contains("REFRESH RATE OFF")

                cy.wait(13000)

                cy.contains("FAST").click();
                cy.contains("REFRESH RATE 5");

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

            cy.route('GET', upgradeProgress_route, 'fixture:upgrade-in-progress').as("inprogres");

            refresh();
            cy.wait("@inprogres");

            cy.get('[data-cy=upgradebanner]').should('exist')

        })
    })


})