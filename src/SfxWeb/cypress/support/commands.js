// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// Select menus are portaled to body. Resolve the menu from its trigger, not its parent.
Cypress.Commands.add('selectMenu', (label, option) => {
  const trigger = `button[aria-label="${label}"][aria-haspopup="listbox"]`;
  cy.get(trigger).should('be.enabled').click();
  cy.get(trigger).should('have.attr', 'aria-expanded', 'true').invoke('attr', 'aria-controls').then(id => {
    expect(id, `${label} menu ID`).to.be.a('string').and.not.be.empty;
    cy.get(`body [id="${id}"][role="listbox"]`).should('be.visible')
      .contains('.option-label', new RegExp(`^${Cypress._.escapeRegExp(option)}$`))
      .closest('[role="option"]').should('be.enabled').click();
  });
  return cy.get(trigger).should('have.attr', 'aria-expanded', 'false').find('span').first().should('have.text', option);
});

Cypress.Commands.add('setExperience', experience => {
  expect(experience).to.be.oneOf(['new', 'classic']);
  cy.get('select[aria-label="SFX experience"], button[aria-label="SFX experience"]').then(control => {
    if (control.is('select')) {
      cy.wrap(control).select(experience);
    } else {
      // Switching to Classic replaces the trigger, so do not assert against the old button.
      cy.wrap(control).click().invoke('attr', 'aria-controls').then(id => {
        expect(id, 'experience menu ID').to.be.a('string').and.not.be.empty;
        cy.get(`body [id="${id}"][role="listbox"]`).should('be.visible')
          .contains('.option-label', experience === 'new' ? 'New' : 'Classic').click();
      });
    }
  });
  cy.get('body').should(experience === 'new' ? 'have.class' : 'not.have.class', 'sfx-new');
  return cy.window().its('localStorage').invoke('getItem', 'sfxNewExperience').should('equal', String(experience === 'new'));
});

// Import cypress code-coverage collector plugin
import '@cypress/code-coverage/support';
