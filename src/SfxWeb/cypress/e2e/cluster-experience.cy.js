import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Modern Cluster pages', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/$/GetLoadInformation?*'), { fixture: 'cluster-page/upgrade/get-load-information.json' });
    cy.intercept('GET', apiUrl('/ImageStore?*'), { Files: [], Folders: [] });
  });
  const routes = [['', 'Cluster overview'], ['details', 'Cluster details'], ['metrics', 'Metrics'], ['clustermap', 'Cluster map'], ['imagestore', 'Image store'], ['manifest', 'Cluster manifest'], ['commands', 'PowerShell commands'], ['orchestration', 'Orchestration'], ['repairtasks', 'Repair jobs'], ['infrastructure', 'Infrastructure jobs']];
  routes.forEach(([route, title]) => {
    it(`supports New and Classic on ${title}`, () => {
      cy.visit(`/#/${route}`);
      cy.get('[aria-label="SFX experience"]').select('new');
      cy.get('.cluster-page-heading h1').should('contain', title);
      cy.get('app-base.cluster-modern').should('have.css', 'font-size', '15px');
      cy.get('[aria-label="SFX experience"]').select('classic');
      cy.get('.cluster-page-heading').should('not.exist');
      cy.get('app-base.cluster-modern').should('not.exist');
    });
  });
  it('searches and wraps manifest XML in the new viewer', () => {
    cy.visit('/#/manifest');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('app-manifest-document').should('exist');
    cy.get('[aria-label="Find in manifest"]').type('ClusterManifest');
    cy.get('app-manifest-document li.match').should('have.length.at.least', 1);
    cy.contains('app-manifest-document label', 'Wrap lines').find('input').check();
    cy.get('app-manifest-document .code-view').should('have.class', 'wrap');
  });
  it('uses compact date and stage controls for orchestration', () => {
    cy.visit('/#/orchestration');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('app-event-query-bar').should('exist');
    cy.get('.stage-filters input').should('have.length', 4);
    cy.get('.orchestration-empty').should('be.visible');
  });
  it('uses colored health filters and node grouping on the new cluster map', () => {
    cy.visit('/#/clustermap');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=clustermap-container] > div').first().should('not.have.class', 'essen-pane').and('have.css', 'border-top-width', '0px');
    cy.get('app-clustermap .compact-node-filter').within(() => {
      cy.contains('button', 'Node types').should('exist');
      cy.get('app-toggle, app-health-badge').should('not.exist');
      cy.get('[data-health=OK] input').should('have.css', 'accent-color', 'rgb(63, 185, 80)');
      cy.get('[data-health=Warning] input').should('have.css', 'accent-color', 'rgb(210, 153, 34)');
      cy.get('[data-health=Error] input').should('have.css', 'accent-color', 'rgb(248, 81, 73)');
      cy.contains('label', 'Group by node type').find('input').check().should('be.checked');
      cy.get('.health-choices input').uncheck();
      cy.get('.health-filter-choice.enabled').should('not.exist');
      cy.get('.health-choices input').check();
    });
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('app-clustermap .compact-node-filter').should('not.exist');
    cy.get('app-clustermap app-toggle').should('exist');
  });
  it('keeps load metric columns readable on desktop and narrow screens', () => {
    cy.visit('/#/details');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.contains('app-detail-view-part h3', 'Load Metric Information').parent().find('table.detail-array').as('metrics');
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
    cy.get('@metrics').closest('.table-responsive').should(wrapper => {
      expect(wrapper[0].scrollWidth).to.be.greaterThan(wrapper[0].clientWidth);
    });
  });
});
