import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Navigator query bar', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/EventsStore/Cluster/Events?*'), []).as('clusterEvents');
    cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*'), []).as('nodeEvents');
    cy.visit('/#/');
    cy.get('[data-cy=navtabs]').contains('events').click();
    cy.wait('@clusterEvents');
  });

  it('loads a compact bar without the classic slider', () => {
    cy.get('app-event-query-bar').should('be.visible');
    cy.get('app-time-picker').should('not.exist');
    cy.get('app-event-query-bar .source-control').should('be.visible');
  });

  it('applies a relative preset ending at now', () => {
    cy.get('[aria-label="Choose event query range"]').click();
    cy.contains('app-event-query-bar button', 'Last hour').click();
    cy.wait('@clusterEvents').then(({ request }) => {
      const url = new URL(request.url);
      const end = Date.parse(url.searchParams.get('endtimeutc'));
      const start = Date.parse(url.searchParams.get('starttimeutc'));
      expect(end - start).to.equal(3600000);
      expect(Math.abs(Date.now() - end)).to.be.lessThan(10000);
    });
    cy.get('[aria-label="Choose event query range"]').should('contain', 'Last hour');
  });

  it('validates a custom range and queries only on Apply', () => {
    cy.get('[aria-label="Choose event query range"]').click();
    cy.contains('app-event-query-bar button', 'Custom range').click();
    const end = new Date(Date.now() - 3600000).toISOString().slice(0, 19);
    const start = new Date(Date.now() - 7200000).toISOString().slice(0, 19);
    cy.get('input[name=queryStart]').clear().type(end);
    cy.get('input[name=queryEnd]').clear().type(start);
    cy.get('@clusterEvents.all').then(requests => {
      const count = requests.length;
      cy.contains('app-event-query-bar button', 'Apply range').click();
      cy.get('app-event-query-bar [role=alert]').should('contain', 'End must be after start');
      cy.get('@clusterEvents.all').should('have.length', count);
      cy.get('input[name=queryStart]').clear().type(start);
      cy.get('input[name=queryEnd]').clear().type(end);
      cy.contains('app-event-query-bar button', 'Apply range').click();
      cy.wait('@clusterEvents');
      cy.get('app-event-query-bar form').should('not.exist');
    });
  });

  it('updates included event sources', () => {
    cy.contains('app-event-query-bar button', 'Event types').click({ scrollBehavior: 'center' });
    cy.contains('app-event-query-bar .source-option', 'Nodes').find('input').uncheck({ scrollBehavior: 'center' });
    cy.get('app-event-results .source-tabs').should('not.contain', 'Nodes');
    cy.contains('app-event-query-bar .source-option', 'Nodes').find('input').check({ scrollBehavior: 'center' });
    cy.wait('@nodeEvents');
    cy.get('app-event-results .source-tabs').should('contain', 'Nodes');
  });

  it('restores classic controls when switching views', () => {
    cy.setExperience('classic');
    cy.get('app-event-query-bar').should('not.exist');
    cy.get('app-time-picker .slider-wrapper').should('exist');
    cy.setExperience('new');
    cy.get('app-event-query-bar').should('be.visible');
  });

  it('fits the custom editor within a narrow viewport', () => {
    cy.viewport(390, 1000);
    cy.get('[aria-label="Choose event query range"]').click({ scrollBehavior: 'center' });
    cy.contains('app-event-query-bar button', 'Custom range').click({ scrollBehavior: 'center' });
    cy.get('app-event-query-bar .popover').should(element => {
      expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1);
    });
    cy.contains('app-event-query-bar button', 'Cancel').click({ scrollBehavior: 'center' });
    cy.get('app-event-query-bar .popover').should('not.exist');
  });
});
