import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Metrics chart and selection', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/Nodes/?*'), { fixture: 'cluster-page/nodes-1-warning.json' });
    cy.intercept('GET', apiUrl('/$/GetLoadInformation?*'), { fixture: 'cluster-page/upgrade/get-load-information.json' });
    cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'), { fixture: 'node-load/get-node-load-information.json' }).as('nodeLoad');
    cy.visit('/#/metrics');
    cy.setExperience('new');
    cy.wait('@nodeLoad');
  });
  it('selects an available metric and renders the chart on initial load', () => {
    cy.get('.selected-metric').should('have.length', 1).and('contain', 'Count');
    cy.get('.metric-controls-header').should('contain', '1 selected').and('contain', '1 of 1 nodes');
    cy.get('app-bar-chart .highcharts-series').should('have.length', 1);
    cy.contains('.metric-trigger', 'Load metrics').click();
    cy.get('.metric-options-menu.show .metric-option input:checked').should('have.length', 1).parent().should('contain', 'Count');
    cy.contains('.metric-trigger', 'Load metrics').click();
    cy.get('.metrics-empty').should('not.exist');
  });
  it('shows a useful message when no metric is selected', () => {
    cy.get('button[aria-label="Remove Count"]').click();
    cy.get('.selected-metric').should('not.exist');
    cy.get('.metric-controls-header').should('contain', '0 selected');
    cy.get('.metrics-empty').should('contain', 'Select a metric');
    cy.get('app-bar-chart').should('not.exist');
  });
  it('filters metric choices and fits narrow screens', () => {
    cy.contains('.metric-trigger', 'Resource capacity').click();
    cy.get('[aria-label="Find resource capacity"]').type('Cpu');
    cy.get('.metric-options-menu.show .metric-option').should('have.length', 1).and('contain', 'Cpu').and('not.contain', 'Memory');
    cy.get('[aria-label="Find resource capacity"]').clear().type('no-such-metric');
    cy.get('.metric-options-menu.show .menu-empty').should('contain', 'No matching metrics');
    cy.get('[aria-label="Find resource capacity"]').clear();
    cy.get('.metric-options-menu.show .metric-option').should('have.length', 2);
    cy.viewport(390, 1000);
    cy.get('.metric-controls, .metric-options-menu.show').should(elements => {
      [...elements].forEach(element => expect(element.scrollWidth).to.be.at.most(element.clientWidth + 1));
    });
    cy.get('.metric-options-menu.show .metric-option > span').should('have.css', 'white-space', 'normal');
  });
  it('filters chart nodes through the Nodes dropdown and restores the selection', () => {
    cy.contains('.metric-trigger', 'Nodes').click();
    cy.get('.metric-nodes-menu.show').should('be.visible').within(() => {
      cy.contains('.compact-node-filter button', 'Node types').should('be.visible');
      cy.get('app-toggle, app-health-badge').should('not.exist');
      cy.get('.health-choices input:checked').should('have.length', 3);
      cy.get('[data-health=OK] input').should('have.css', 'accent-color', 'rgb(63, 185, 80)');
      cy.get('[data-health=Warning] input').should('have.css', 'accent-color', 'rgb(210, 153, 34)').uncheck();
      cy.get('[data-health=Error] input').should('have.css', 'accent-color', 'rgb(248, 81, 73)');
    });
    cy.get('.metric-controls-header').should('contain', '0 of 1 nodes');
    cy.get('.metrics-empty').should('contain', 'No nodes match');
    cy.get('app-bar-chart').should('not.exist');
    cy.get('.metric-nodes-menu.show [data-health=Warning] input').check();
    cy.get('.metric-controls-header').should('contain', '1 of 1 nodes');
    cy.get('app-bar-chart .highcharts-series').should('have.length', 1);
    cy.get('.selected-metric').should('have.length', 1).and('contain', 'Count');
  });
  it('replaces the selection when changing metric groups and supports multiple metrics within a group', () => {
    cy.contains('.metric-trigger', 'Resource capacity').click();
    cy.contains('.metric-options-menu.show .metric-option', 'Reserved CpuCores').find('input').check();
    cy.get('.selected-metric').should('have.length', 1).and('contain', 'Reserved CpuCores').and('not.contain', 'Count');
    cy.contains('.metric-options-menu.show .metric-option', 'Reserved MemoryInMB').find('input').check();
    cy.get('.selected-metric').should('have.length', 2);
    cy.get('app-bar-chart .highcharts-series').should('have.length', 2);
    cy.contains('.metric-trigger', 'Resource capacity').find('.selection-count').should('have.text', '2');
    cy.contains('.metric-trigger', 'Load metrics').find('.selection-count').should('have.text', '0');
    cy.contains('.metric-trigger', 'Resource capacity').click();
    cy.get('button[aria-label="Remove Reserved CpuCores"]').click();
    cy.get('.selected-metric').should('have.length', 1).and('contain', 'Reserved MemoryInMB');
    cy.get('app-bar-chart .highcharts-series').should('have.length', 1);
    cy.contains('.metric-trigger', 'Load metrics').click();
    cy.get('.metric-options-menu.show .metric-option > span').contains(/^Count$/).parent().find('input').check();
    cy.get('.selected-metric').should('have.length', 1).and('contain', 'Count');
    cy.contains('.metric-trigger', 'Resource capacity').find('.selection-count').should('have.text', '0');
  });
  it('places controls above the chart without a legacy sidebar', () => {
    [1800, 390].forEach(width => {
      cy.viewport(width, 1000);
      cy.get('.modern-metrics').should(layout => {
        const controls = layout[0].querySelector('.metric-controls').getBoundingClientRect();
        const chart = layout[0].querySelector('.layout-container').getBoundingClientRect();
        expect(chart.top - controls.bottom).to.be.at.least(16);
        expect(chart.left).to.be.closeTo(controls.left, 1);
        expect(chart.width).to.be.closeTo(controls.width, 1);
        expect(layout[0].scrollWidth).to.be.at.most(layout[0].clientWidth + 1);
      });
    });
    cy.get('.metric-sidebar, .sidebar-resizer').should('not.exist');
  });
});
