/// <reference types="cypress" />

import { addDefaultFixtures, FIXTURE_REF_APPS } from './util';

const appTypeName = "VisualObjectsApplicationType";
const appname = "fabric:/VisualObjectsApplicationType";

context('app', () => {
    beforeEach(() => {
        addDefaultFixtures();
        cy.visit(`/#/apptype/${appTypeName}`)
    })

    describe("essentials", () => {
        it('load essentials', () => {
            cy.get('[data-cy=header').within(() => {
                cy.contains(`Application Type ${appTypeName}`).click();
              })

            cy.get('[data-cy=appTypeVersions]').within(() => {
                cy.contains(appTypeName)
                cy.contains('16.0.0')
            })

            cy.get('[data-cy=applicationsList]').within(() => {
                cy.contains(appname)
            })
        })

    })

    describe("details", () => {
        it('view details', () => {
            cy.wait(FIXTURE_REF_APPS);

            cy.get('[data-cy=navtabs]').within(() => {
                cy.contains('details').click();
            })
    
            cy.url().should('include', `/#/apptype/${appTypeName}/details`)
        })
    })
})