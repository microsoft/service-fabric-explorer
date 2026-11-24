/// <reference types="cypress" />

import { addDefaultFixtures, refresh, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS } from './util.cy';

context('Header', () => {

    beforeEach(() => {
        addDefaultFixtures();
    })

    describe("CSP compatibility", () => {
        it("loads the stylesheet when inline script handlers are blocked", () => {
            cy.intercept('GET', '/index.html', (req) => {
                req.continue((res) => {
                    // Isolate inline-handler enforcement from Cypress's injected scripts.
                    res.body = res.body.replace(
                        '<head>',
                        `<head><meta http-equiv="Content-Security-Policy" content="script-src-attr 'none'">`
                    );
                });
            });

            cy.visit('/index.html');
            cy.get('meta[http-equiv="Content-Security-Policy"]')
                .should('have.attr', 'content', "script-src-attr 'none'");
            cy.window().then((win) => {
                const probe = win.document.createElement('button');
                probe.setAttribute('onclick', "this.setAttribute('data-ran', 'true')");
                win.document.body.appendChild(probe);
                probe.click();
                expect(probe.hasAttribute('data-ran')).to.be.false;
                probe.remove();
            });
            cy.get('link[rel="stylesheet"][href^="styles"]').should(($links) => {
                expect($links).to.have.length.greaterThan(0);
                const link = $links[0];
                expect(link.media === '' || link.ownerDocument.defaultView.matchMedia(link.media).matches).to.be.true;
                expect(link.sheet).not.to.be.null;
            });
        });
    });

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
