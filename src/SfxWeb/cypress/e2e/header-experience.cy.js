import { addDefaultFixtures } from './util.cy';

describe('Modern header', () => {
  beforeEach(() => { addDefaultFixtures(); cy.visit('/#/'); cy.setExperience('new'); });
  it('groups refresh settings and retains refresh functionality', () => {
    cy.get('.modern-header .header-branding').should('contain', 'Service Fabric Explorer');
    cy.get('.modern-header .header-controls').should('be.visible');
    cy.selectMenu('Auto-refresh interval', '30 sec');
    cy.get('button[aria-label="Auto-refresh interval"]').should('contain', '30 sec');
    cy.get('[aria-label="Refresh now"]').click();
    cy.setExperience('classic');
    cy.get('.modern-refresh').should('not.exist');
    cy.get('.rate-picker').should('exist');
  });
  it('fits the controls on a narrow screen', () => {
    cy.viewport(390, 1000);
    cy.get('button[aria-label="SFX experience"]').should('be.visible');
    cy.get('[aria-label="Refresh now"]').should('be.visible');
    cy.get('.header-bar').should(header => expect(header[0].scrollWidth).to.be.at.most(header[0].clientWidth + 1));
  });
});
