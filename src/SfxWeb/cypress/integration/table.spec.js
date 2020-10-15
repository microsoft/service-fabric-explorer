/// <reference types="cypress" />

import {
    apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH
} from './util';

context('table', () => {

    beforeEach(() => {
        cy.server()
        addDefaultFixtures();
        cy.visit('')

        cy.wait(FIXTURE_REF_CLUSTERHEALTH)
    })

    describe("export", () => {
        const rowsSelector = "[data-cy=row]";
        const columnSelector = "[data-cy=columns]";
        const exportButtonSelector = "[data-cy=export]";

        beforeEach(() => {
            cy.get('[data-cy=health]').within(() => {
                cy.contains("Export").click();
            })
        })

        it('unselect 1 column', () => {
            cy.get('[data-cy=modal]').within(() => {
                cy.get(columnSelector).within(() => {
                    cy.contains('Health State').click();
                })

                cy.get(exportButtonSelector).click();
                cy.get(rowsSelector).first().should('contain', 'Kind,Description')
            })
        })

        it('unselect all columns', () => {
            cy.get('[data-cy=modal]').within(() => {
                cy.get(columnSelector).within(() => {
                    cy.contains('Health State').click();
                    cy.contains('Kind').click();
                    cy.contains('Description').click();
                })

                cy.get(exportButtonSelector).click();
                cy.get(rowsSelector).first().should(elem => expect(elem.text().trim()).length(0));
            })
        })

        it('rows show up properly ', () => {
            cy.get('[data-cy=modal]').within(() => {
                cy.get(exportButtonSelector).click();

                cy.get(rowsSelector).should('have.length', 5);
                cy.get(rowsSelector).first().should('contain', 'Kind,Health State,Description')
            })
        })
    })
})

/*
test TODO
paged data
    select new page

refresh data
filter
reset all
*/