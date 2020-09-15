/// <reference types="cypress" />

import { apiUrl, addDefaultFixtures, FIXTURE_REF_CLUSTERHEALTH, nodes_route, upgradeProgress_route, FIXTURE_REF_UPGRADEPROGRESS, FIXTURE_REF_MANIFEST } from './util';

const LOAD_INFO = "getloadinfo"

context('apps list page', () => {

    beforeEach(() => {

        cy.server()
        addDefaultFixtures();
        // cy.route('GET', apiUrl('/$/GetLoadInformation?*'), 'fx:cluster-page/upgrade/get-load-information').as(LOAD_INFO);

    })

    describe("essentials", () => {
        it('load essentials', () => {

        })

    })
})