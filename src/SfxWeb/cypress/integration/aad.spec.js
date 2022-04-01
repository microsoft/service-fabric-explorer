// /// <reference types="cypress" />

// import { aad_route, addDefaultFixtures } from './util';


// context('aad', () => {

//     beforeEach(() => {
//         addDefaultFixtures();
//     })

//     describe("non default domain", () => {
//         it('chinese configured domain', () => {
//             cy.intercept('GET', aad_route,
//                 {
//                     fixture: "aad/china.json"
//                 })

//             cy.visit('')

//             cy.url().should('include', 'https://login.partner.microsoftonline.cn/c35cd1e2-c25c-4012-bec2-27c0537bd664')
//         })
//     })
// })
