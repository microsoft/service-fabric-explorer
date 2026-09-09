import { addDefaultFixtures } from './util.cy';

describe('Modern header', () => {
  beforeEach(() => { addDefaultFixtures(); cy.visit('/#/'); cy.get('[aria-label="SFX experience"]').select('new'); });
  it('groups refresh settings and retains refresh functionality', () => {
    cy.get('.modern-header .header-branding').should('contain', 'Service Fabric Explorer');
    cy.get('.modern-header .header-controls').should('be.visible');
    cy.get('[aria-label="Auto-refresh interval"]').select('30 sec');
    cy.get('[aria-label="Auto-refresh interval"]').should('contain', '30 sec');
    cy.get('[aria-label="Refresh now"]').click();
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('.modern-refresh').should('not.exist');
    cy.get('.rate-picker').should('exist');
  });
  it('fits the controls on a narrow screen', () => {
    cy.viewport(390, 1000);
    cy.get('[aria-label="SFX experience"]').should('be.visible');
    cy.get('[aria-label="Refresh now"]').should('be.visible');
    cy.get('.header-bar').should(header => expect(header[0].scrollWidth).to.be.at.most(header[0].clientWidth + 1));
  });
});
