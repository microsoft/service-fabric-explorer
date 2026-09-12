// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Keep the original suite on its original UI; newer specs explicitly cover New.
const classicSpecs = new Set([
  'app.cy.js', 'apps.cy.js', 'appType.cy.js', 'cluster.cy.js', 'cluster-insights.cy.js',
  'deployedApplication.cy.js', 'deployedCodePackages.cy.js', 'deployedReplica.cy.js',
  'deployedService.cy.js', 'header.cy.js', 'network.cy.js', 'node.cy.js', 'nodes.cy.js',
  'partition.cy.js', 'replica.cy.js', 'service.cy.js', 'sharedComponent.cy.js', 'tree.cy.js'
]);
if (classicSpecs.has(Cypress.spec.name)) {
  Cypress.on('window:before:load', win => win.localStorage.setItem('sfxNewExperience', 'false'));
}

// Alternatively you can use CommonJS syntax:
// require('./commands')
Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return true
  })
