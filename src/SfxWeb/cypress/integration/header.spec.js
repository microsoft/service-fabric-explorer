/// <reference types="cypress" />

import { addDefaultFixtures, refresh, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS } from './util';

context('Header', () => {

    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.visit('');
    })

    describe("refresh rate", () => {
        it('change rate', () => {
            /*
            Use upgrade progress as our "polling" request
            Set refresh to OFF, wait for the first request to kick off
            wait 13 seconds and ensure only request has been sent so far.
            */
            cy.get('[data-cy=refreshrate]').within(() => {
                cy.contains("REFRESH RATE 10")

                cy.contains('OFF').click();
                cy.contains("REFRESH RATE OFF")

                cy.wait(FIXTURE_REF_UPGRADEPROGRESS);

                cy.wait(13000)
                cy.get(FIXTURE_REF_UPGRADEPROGRESS + '.2').should('not.exist')

                cy.contains("FAST").click();
                cy.contains("REFRESH RATE 5");

                cy.wait(FIXTURE_REF_UPGRADEPROGRESS);
                cy.get(FIXTURE_REF_UPGRADEPROGRESS + '.3').should('not.exist')
            })
        })

    })

    describe("upgrade banner", () => {

        it.only("dont show then show", () => {
            cy.get('[data-cy=upgradebanner]').should('not.exist')

            cy.route('GET', upgradeProgress_route, 'fixture:upgrade-in-progress').as("inprogres");
            
            refresh();
            cy.wait("@inprogres");

            cy.get('[data-cy=upgradebanner]').should('exist')

        })
    })


})