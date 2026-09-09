import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Repair navigator destination', () => {
  it('opens the selected repair in its table', () => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/$/GetRepairTaskList?*'), { fixture: 'cluster-page/repair-jobs/simple.json' });
    cy.visit('/#/repairtasks');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('app-event-navigator .mark').first().click({ scrollBehavior: 'center' });
    cy.get('app-event-navigator .inspector-properties dd').should('have.css', 'white-space', 'pre');
    cy.contains('app-event-navigator button', 'Open in repair table').click({ scrollBehavior: 'center' });
    cy.get('app-repair-tasks app-detail-list input').should(inputs => {
      expect([...inputs].some(input => input.value.length > 0)).to.equal(true);
    });
    cy.get('app-repair-task-view').should('exist');
  });
});
