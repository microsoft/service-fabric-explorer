import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Naming metrics layout', () => {
  const openNaming = (fixture) => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/EventsStore/Cluster/Events?*'), []);
    cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*'), []);
    cy.intercept('GET', apiUrl('/Applications/System/$/GetServices/System%2FNamingService/$/GetPartitions?*'), { fixture: 'cluster-page/naming/naming-partitions.json' });
    cy.intercept('GET', apiUrl('/EventsStore/Partitions/00000000-0000-0000-0000-000000001000/$/Replicas/Events?*'), { fixture }).as('namingEvents');
    cy.visit('/#/');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=navtabs]').contains('naming').click();
    cy.wait('@namingEvents');
  };

  it('shows a compact empty state and retains expand/collapse', () => {
    openNaming('empty-list.json');
    cy.get('app-naming-viewer .naming-empty').should('contain', 'No naming metrics in this range');
    cy.get('app-naming-viewer').closest('app-collapse-container').as('metricsSection');
    cy.get('@metricsSection').find('button[aria-label="Close Metrics Section"]').click();
    cy.get('app-naming-viewer').should('not.exist');
    cy.get('button[aria-label="Open Metrics Section"]').click();
    cy.get('app-naming-viewer .naming-empty').should('be.visible');
  });

  it('keeps selection controls available when all partitions are hidden', () => {
    openNaming('cluster-page/naming/naming-partition-1000.json');
    cy.get('app-naming-viewer .partition-choice input').first().uncheck();
    cy.get('app-naming-viewer .naming-empty').should('contain', 'No metrics selected');
    cy.get('app-naming-viewer .partition-choice input').first().should('be.visible').check();
    cy.get('app-naming-viewer app-timeseries').should('be.visible');
  });

  it('closes the operation menu using its trigger, outside click, or Escape', () => {
    openNaming('cluster-page/naming/naming-partition-1000.json');
    cy.get('[aria-label="SFX experience"]').select('classic');
    const trigger = 'app-naming-viewer [ngbDropdownToggle]';
    const menu = 'app-naming-viewer .dropdown-container';
    cy.get(menu).should('not.be.visible');
    cy.get(trigger).first().click({ scrollBehavior: 'center' }).should('have.attr', 'aria-expanded', 'true');
    cy.get(menu).first().should('be.visible');
    cy.contains(menu + ' button', 'Check All').click();
    cy.get(trigger).first().click().should('have.attr', 'aria-expanded', 'false');
    cy.get(menu).should('not.be.visible');
    cy.get(trigger).first().click();
    cy.get('.header-bar').click('center');
    cy.get(menu).should('not.be.visible');
    cy.get(trigger).first().click().type('{esc}');
    cy.get(menu).should('not.be.visible');
    cy.get(trigger).first().should('have.attr', 'aria-expanded', 'false');
  });
});
