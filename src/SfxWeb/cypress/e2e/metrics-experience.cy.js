import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Metrics chart and selection', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/Nodes/?*'), { fixture: 'cluster-page/nodes-1-warning.json' });
    cy.intercept('GET', apiUrl('/$/GetLoadInformation?*'), { fixture: 'cluster-page/upgrade/get-load-information.json' });
    cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), { fixture: 'node-load/get-node-load-information.json' }).as('nodeLoad');
    cy.visit('/#/metrics');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.wait('@nodeLoad');
  });
  it('selects an available metric and renders the chart on initial load', () => {
    cy.get('.metric-option input:checked').should('have.length.at.least', 1);
    cy.get('app-bar-chart .highcharts-series').should('exist');
    cy.get('.metric-sidebar').should('be.visible');
    cy.get('.metrics-empty').should('not.exist');
  });
  it('shows a useful message when no metric is selected', () => {
    cy.get('.metric-option input:checked').uncheck();
    cy.get('.metrics-empty').should('contain', 'Select a metric');
    cy.get('app-bar-chart').should('not.exist');
  });
  it('filters metric choices and fits narrow screens', () => {
    cy.get('[aria-label="Find a metric"]').type('Cpu');
    cy.get('.metric-option').should('contain', 'Cpu').and('not.contain', 'Memory');
    cy.viewport(390, 1000);
    cy.get('.metric-sidebar').should(element => expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1));
  });
  it('uses clean health filters and keeps metric names on one line', () => {
    cy.contains('.compact-node-filter button', 'Node types').should('exist');
    cy.get('.compact-node-filter app-toggle, .compact-node-filter app-health-badge').should('not.exist');
    cy.get('.metric-option > span').should('have.css', 'white-space', 'nowrap');
    cy.get('.metric-sidebar .health-choices input:checked').should('have.length', 3);
    cy.get('.metric-sidebar .health-choices [data-health=OK]').should('have.css', 'border-left-color', 'rgb(63, 185, 80)');
    cy.get('.metric-sidebar .health-choices [data-health=Warning] input').should('have.css', 'accent-color', 'rgb(210, 153, 34)');
    cy.get('.metric-sidebar .health-choices [data-health=Error] input').should('have.css', 'accent-color', 'rgb(248, 81, 73)');
    cy.get('.metric-sidebar .health-choices input').uncheck();
    cy.get('.metrics-empty').should('contain', 'No nodes match');
    cy.get('.metric-sidebar .health-choices input').check();
    cy.get('app-bar-chart .highcharts-series').should('exist');
  });
  it('resizes the sidebar with keyboard and pointer controls', () => {
    cy.viewport(1800, 1000);
    cy.get('.metric-sidebar').invoke('outerWidth').then(before => {
      cy.get('[aria-label="Resize metric selection panel"]').focus().type('{rightarrow}');
      cy.get('.metric-sidebar').invoke('outerWidth').should('be.greaterThan', before);
    });
    cy.get('.sidebar-resizer').then(handle => {
      const rect = handle[0].getBoundingClientRect();
      const opts = { pointerId: 1, button: 0, eventConstructor: 'PointerEvent', clientY: rect.top + 20 };
      cy.wrap(handle).trigger('pointerdown', { ...opts, clientX: rect.left });
      cy.wrap(handle).trigger('pointermove', { ...opts, clientX: rect.left + 60 });
      cy.wrap(handle).trigger('pointerup', { ...opts, clientX: rect.left + 60 });
      cy.get('.sidebar-resizer').should('have.attr', 'aria-valuenow', '500');
    });
  });
});
