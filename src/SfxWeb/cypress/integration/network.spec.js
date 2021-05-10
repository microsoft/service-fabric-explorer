/// <reference types="cypress" />

import { addDefaultFixtures,  FIXTURE_REF_CLUSTERHEALTHCHUNK, turnOffRefresh, refresh } from './util';

const requestCount = '[data-cy=lastxrequests]';
const infoPane = '[data-cy=info-pane]';
const recording = '[data-cy=recording]';

context('Network Page', () => {

    beforeEach(() => {
        addDefaultFixtures();

        cy.visit('/#/networking')
        turnOffRefresh();
        cy.wait(FIXTURE_REF_CLUSTERHEALTHCHUNK)
    })

    describe("load page", () => {
        it('landing page', () => {

            cy.get(infoPane).within(() => {
                cy.get('[data-cy=failurerate]').within(() => {
                    cy.contains('Failure rate')
                    cy.contains('0%')
                })
            })
        })

        it('pause recording', () => {
            let requests;
            cy.get(requestCount).within(ele => {
                requests = ele.text()
            })
            
            //pause recording
            cy.get(recording).within(() => {
                cy.get('input').click();
            })

            //request count shouldnt go up
            refresh();

            cy.get(requestCount).within(ele => {
                expect(ele.text()).to.be.equal(requests);
            })

            //unpause
            cy.get(recording).within(() => {
                cy.get('input').click();
            })

            //request count should go up
            refresh();
            cy.get(requestCount).within(ele => {
                expect(parseInt(ele.text())).to.be.greaterThan(parseInt(requests));
            })
        })

        it.only('clear log', () => {
            cy.get(requestCount).within(ele => {
                expect(parseInt(ele.text())).to.be.greaterThan(0);
            })
            
            //pause recording
            cy.contains("Clear Log").click();
            cy.get(requestCount).within(ele => {
                expect(ele.text()).to.be.equal("0");
            })

            //request count should go up
            refresh();
            cy.wait(FIXTURE_REF_CLUSTERHEALTHCHUNK)

            cy.get(requestCount).within(ele => {
                expect(parseInt(ele.text())).to.be.greaterThan(0);
            })
        })
    })
    
})