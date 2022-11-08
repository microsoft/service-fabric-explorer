/// <reference types="cypress" />

import { addDefaultFixtures, FIXTURE_REF_APPS, apiUrl } from './util.cy';

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


        //given we dont know exactly which request will go first, we need to wait for both and then check both requests
        cy.wait('@getunprovision');
        cy.wait('@getunprovision');

        cy.get('@getunprovision.0').then(request1 => {
          cy.get('@getunprovision.1').then(request2 => {
            const versionsSeen = [request1.request.body.ApplicationTypeVersion, request2.request.body.ApplicationTypeVersion];
            expect(versionsSeen).to.include.members(["16.0.0", "17.0.0"])
          })
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
  
    describe("commands", () => {
      it('view commands', () => {
          cy.wait(FIXTURE_REF_APPS);

          cy.get('[data-cy=navtabs]').within(() => {
              cy.contains('commands').click();
          })

          cy.url().should('include', 'commands');
      
          cy.wait(500);

          cy.get('[data-cy=safeCommands]');
          cy.get('[data-cy=command]').should('have.length', 1);

      })
  })
})
