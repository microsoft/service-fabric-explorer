import { addDefaultFixtures, apiUrl } from './util.cy';

describe('New Events experience', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*'), []);
    cy.intercept('GET', apiUrl('/EventsStore/Cluster/Events?*'), Array.from({ length: 32 }, (_, i) => ({ Kind: 'ClusterUpgradeStarted', EventInstanceId: `event-${i}`, TimeStamp: new Date(Date.now() - (i + 1) * 60000).toISOString(), Category: i % 2 ? 'Upgrade' : 'Operational', TargetClusterVersion: '11.8', CurrentClusterVersion: '11.7', UpgradeType: 'Rolling' })));
    cy.visit('/#/'); cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=navtabs]').contains('events').click();
    cy.get('app-event-results .row-toggle').should('have.length', 25);
  });
  it('shows the new page and a useful RCA empty state', () => {
    cy.get('app-event-analysis').should('not.contain', 'Related-event analysis, not a confirmed diagnosis.');
    cy.get('.timeline-view-switch').should('not.exist');
    cy.get('app-event-analysis').should('contain', 'No supported scenarios');
    cy.get('app-event-results').should('contain', '32 matching events');
  });
  it('paginates, searches, filters, sorts and expands JSON', () => {
    cy.contains('app-event-results button', 'Next').click();
    cy.get('app-event-results .row-toggle').should('have.length', 7);
    cy.get('[aria-label="Search event records"]').type('event-31');
    cy.get('app-event-results .row-toggle').should('have.length', 1).click();
    cy.get('app-event-results pre').should('contain', 'event-31');
    cy.contains('app-event-results button', 'Clear filters').click();
    cy.get('[aria-label="Event category"]').select('Upgrade');
    cy.get('app-event-results .row-toggle').should('have.length', 16);
    cy.contains('app-event-results th button', 'Timestamp').click();
    cy.get('app-event-results th[aria-sort=ascending]').should('exist');
  });
  it('persists the header choice and restores the classic page', () => {
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('app-event-results').should('not.exist'); cy.get('app-detail-list').should('exist');
    cy.reload(); cy.get('[aria-label="SFX experience"]').should('have.value', 'classic');
    cy.get('[aria-label="SFX experience"]').select('new'); cy.get('app-event-results').should('exist');
  });
  it('keeps the header switch and results usable on a narrow screen', () => {
    cy.viewport(390, 1000);
    cy.get('[aria-label="SFX experience"]').should('be.visible');
    cy.get('app-event-results .results').should(element => expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1));
  });
});
