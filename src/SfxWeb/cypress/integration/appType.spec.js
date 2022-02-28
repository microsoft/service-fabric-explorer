/// <reference types="cypress" />

import { addDefaultFixtures, FIXTURE_REF_APPS, apiUrl } from './util';

const appTypeName = "VisualObjectsApplicationType";
const appname = "fabric:/VisualObjectsApplicationType";

context('app type', () => {
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

      it('unprovision', () => {
        cy.intercept('POST', apiUrl('/ApplicationTypes/VisualObjectsApplicationType/$/Unprovision?*'), {
          statusCode: 200,
          body: {},
        }).as("getunprovision");

        cy.get('[data-cy=actions]').within(() => {
          cy.contains("Actions").click();
          cy.contains("Unprovision").click()
        }).then(() => {
          cy.get(".action-modal").within(() => {
            cy.get('[data-cy=input-dialog]');
          }).type('VisualObjectsApplicationType')

          cy.get('[data-cy=submit]').click();
        })

        cy.wait('@getunprovision').then(interception => {
          cy.wrap(interception.request.body)
            .should("have.property", "ApplicationTypeVersion", "16.0.0")
        })

        cy.wait('@getunprovision').then(interception => {
          cy.wrap(interception.request.body)
            .should("have.property", "ApplicationTypeVersion", "17.0.0")
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
