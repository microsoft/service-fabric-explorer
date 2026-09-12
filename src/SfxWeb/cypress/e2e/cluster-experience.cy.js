import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Modern Cluster pages', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/$/GetLoadInformation?*'), { fixture: 'cluster-page/upgrade/get-load-information.json' });
    cy.intercept('GET', apiUrl('/ImageStore?*'), { Files: [], Folders: [] });
  });
  const routes = [['', 'essentials'], ['details', 'details'], ['metrics', 'metrics'], ['clustermap', 'cluster map'], ['imagestore', 'image store'], ['manifest', 'manifest'], ['commands', 'commands'], ['orchestration', 'orchestration'], ['repairtasks', 'repair jobs'], ['infrastructure', 'infrastructure']];
  routes.forEach(([route, title]) => {
    it(`supports New and Classic on ${title}`, () => {
      cy.visit(`/#/${route}`);
      cy.setExperience('new');
      cy.get('app-navbar h1 [data-cy=header]').should('be.visible').and('contain', 'Cluster');
      cy.get('[data-cy=navtabs] .current').should('contain', title);
      cy.get('.cluster-page-heading').should('not.exist');
      cy.get('app-base.cluster-modern').should('have.css', 'font-size', '15px');
      cy.setExperience('classic');
      cy.get('.cluster-page-heading').should('not.exist');
      cy.get('app-base.cluster-modern').should('not.exist');
    });
  });
  it('searches and wraps manifest XML in the new viewer', () => {
    cy.visit('/#/manifest');
    cy.setExperience('new');
    cy.get('app-manifest-document').should('exist');
    cy.get('[aria-label="Find in manifest"]').type('ClusterManifest');
    cy.get('app-manifest-document li.match').should('have.length.at.least', 1);
    cy.contains('app-manifest-document label', 'Wrap lines').find('input').check();
    cy.get('app-manifest-document .code-view').should('have.class', 'wrap');
  });
  it('uses compact date and stage controls for orchestration', () => {
    cy.visit('/#/orchestration');
    cy.setExperience('new');
    cy.get('app-event-query-bar').should('be.visible');
    cy.get('.stage-filter-trigger').should('contain', '4 / 4').click({ scrollBehavior: 'center' });
    cy.get('.stage-filter-menu.show').should('be.visible').within(() => {
      cy.get('input:checked').should('have.length', 4);
      ['Balancing', 'Placement', 'Constraint check', 'Other operations'].forEach(stage => {
        cy.contains('label', stage).find('input').uncheck({ scrollBehavior: 'center' });
      });
      cy.get('input:checked').should('have.length', 0);
    });
    cy.get('.stage-filter-trigger').should('contain', '0 / 4');
    cy.get('.stage-filter-menu.show input').check({ scrollBehavior: 'center' });
    cy.get('.stage-filter-trigger').should('contain', '4 / 4').click({ scrollBehavior: 'center' }).should('have.attr', 'aria-expanded', 'false');
    cy.get('app-partition-picker button.load').should('be.disabled');
    cy.get('app-orchestration-view app-event-navigator').should('not.exist');
  });
  it('uses colored health filters and node grouping on the new cluster map', () => {
    cy.visit('/#/clustermap');
    cy.setExperience('new');
    cy.get('[data-cy=clustermap-container] > div').first().should('not.have.class', 'essen-pane').and('have.css', 'border-top-width', '0px');
    cy.get('app-clustermap .compact-node-filter').within(() => {
      cy.contains('button', 'Node types').should('be.visible');
      cy.get('app-toggle, app-health-badge').should('not.exist');
      cy.contains('label', 'Group by node type').find('input').check().should('be.checked');
      cy.get('button[aria-label="Filter nodes by health"]').should('contain', '3 / 3').click();
    });
    cy.get('body .node-health-menu.show').should('be.visible').within(() => {
      cy.get('[data-health=OK] input').should('have.css', 'accent-color', 'rgb(63, 185, 80)');
      cy.get('[data-health=Warning] input').should('have.css', 'accent-color', 'rgb(210, 153, 34)');
      cy.get('[data-health=Error] input').should('have.css', 'accent-color', 'rgb(248, 81, 73)');
      cy.get('input').should('have.length', 3).uncheck();
      cy.get('input:checked').should('have.length', 0);
    });
    cy.get('button[aria-label="Filter nodes by health"]').should('contain', '0 / 3');
    cy.get('body .node-health-menu.show input').check();
    cy.get('button[aria-label="Filter nodes by health"]').should('contain', '3 / 3').click().should('have.attr', 'aria-expanded', 'false');
    cy.setExperience('classic');
    cy.get('app-clustermap .compact-node-filter').should('not.exist');
    cy.get('app-clustermap app-toggle').should('exist');
  });
  it('keeps load metric columns readable on desktop and narrow screens', () => {
    cy.visit('/#/details');
    cy.setExperience('new');
    cy.get('app-detail-view-part [aria-label="Load Metric Information"]').as('metricSection').should('not.have.attr', 'open');
    cy.get('@metricSection').children('summary').click({ scrollBehavior: 'center' });
    cy.get('@metricSection').should('have.attr', 'open');
    cy.get('@metricSection').find('.property-record-table').as('metrics');
    cy.fixture('cluster-page/upgrade/get-load-information.json').then(load => {
      cy.get('@metrics').find('tbody tr').should('have.length', load.LoadMetricInformation.length);
      cy.get('@metrics').find('tbody tr td:first-child').should(cells => {
        expect([...cells].map(cell => cell.textContent.trim())).to.deep.equal(load.LoadMetricInformation.map(metric => metric.Name));
      });
      cy.get('@metrics').find('tbody tr').first().should('contain', 'NewReplicaPlacement').and('contain', '0.003849');
    });
    const checkColumns = () => {
      cy.get('@metrics').find('thead th').should(headers => {
        expect(headers.length).to.be.greaterThan(3);
        [...headers].forEach(header => {
          expect(header.getBoundingClientRect().width).to.be.at.least(130);
          expect(header.getBoundingClientRect().height).to.be.lessThan(110);
        });
      });
    };
    checkColumns();
    cy.viewport(390, 1000);
    checkColumns();
    cy.get('@metrics').closest('.property-records').should(wrapper => {
      expect(wrapper[0].scrollWidth).to.be.greaterThan(wrapper[0].clientWidth);
    }).scrollTo('right');
    cy.get('@metricSection').should(section => expect(section[0].scrollWidth).to.be.at.most(section[0].clientWidth + 1));
    cy.get('@metricSection').invoke('outerHeight').then(expandedHeight => {
      cy.get('@metricSection').children('summary').click({ scrollBehavior: 'center' });
      cy.get('@metricSection').should('not.have.attr', 'open');
      cy.get('@metricSection').should(section => {
        const summary = section[0].querySelector('summary').getBoundingClientRect();
        const bounds = section[0].getBoundingClientRect();
        expect(bounds.height).to.be.lessThan(expandedHeight);
        expect(bounds.bottom).to.be.closeTo(summary.bottom, 1);
      });
      cy.get('@metricSection').invoke('outerHeight').then(collapsedHeight => {
        cy.get('@metricSection').children('summary').click({ scrollBehavior: 'center' });
        cy.get('@metricSection').should('have.attr', 'open');
        cy.get('@metricSection').invoke('outerHeight').should('be.greaterThan', collapsedHeight);
        checkColumns();
      });
    });
  });
});
