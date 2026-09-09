import { addDefaultFixtures, addRoute, apiUrl } from './util.cy';

describe('Shared New experience', () => {
  beforeEach(() => {
    addDefaultFixtures();
    addRoute('nodeInfo', 'node-page/node-info.json', apiUrl('/Nodes/_nt_0/?api-version=3.0*'));
    addRoute('nodeHealth', 'node-page/health.json', apiUrl('/Nodes/_nt_0/$/GetHealth?*'));
    addRoute('nodeApps', 'node-page/apps.json', apiUrl('/Nodes/_nt_0/$/GetApplications?*'));
    addRoute('nodeLoad', 'node-load/get-node-load-information.json', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'));
    addRoute('application', 'app-page/app-type.json', apiUrl('/Applications/VisualObjectsApplicationType/?a*'));
    addRoute('appManifest', 'app-page/manifest.json', apiUrl('/Applications/VisualObjectsApplicationType/$/GetApplicationManifest?*'));
    addRoute('appTypeManifest', 'app-page/app-manifest.json', apiUrl('/ApplicationTypes/VisualObjectsApplicationType/$/GetApplicationManifest?*'));
    addRoute('serviceTypes', 'app-page/service-types.json', apiUrl('/ApplicationTypes/VisualObjectsApplicationType/$/GetServiceTypes?*'));
    addRoute('appHealth', 'app-page/app-health.json', apiUrl('/Applications/VisualObjectsApplicationType/$/GetHealth?*'));
    addRoute('appServices', 'app-page/services.json', apiUrl('/Applications/VisualObjectsApplicationType/$/GetServices?*'));
    addRoute('appUpgrade', 'app-page/upgrade-progress.json', apiUrl('/Applications/VisualObjectsApplicationType/$/GetUpgradeProgress?*'));
  });

  it('themes shell and non-cluster lists and restores Classic', () => {
    cy.visit('/#/nodes');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('body').should('have.class', 'sfx-new');
    cy.get('.header-bar').should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('table.detail-list').first().should('have.css', 'background-color', 'rgb(13, 17, 23)');
    cy.get('.list-toolbar .simple-button').first().should('have.css', 'background-color', 'rgb(33, 38, 45)');
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('body').should('not.have.class', 'sfx-new');
    cy.get('.header-bar').should('have.css', 'background-color', 'rgb(38, 38, 38)');
  });

  it('themes export dialogs outside the routed page', () => {
    cy.visit('/#/nodes');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.contains('app-detail-list button', 'Export').first().click();
    cy.get('.cdk-overlay-container .action-modal').should('be.visible').and('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('.cdk-overlay-container .modal-header').should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.contains('.cdk-overlay-container button', 'Cancel').click();
    cy.get('.cdk-overlay-container .action-modal').should('not.exist');
  });

  it('uses colored health checkboxes in the tree and restores classic toggles', () => {
    cy.visit('/#/nodes');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('app-tree-view .tree-health-filters').within(() => {
      cy.get('app-toggle, app-health-badge').should('not.exist');
      cy.get('[data-health=OK]').should('have.css', 'border-left-color', 'rgb(63, 185, 80)');
      cy.get('[data-health=Warning]').should('have.css', 'border-left-color', 'rgb(210, 153, 34)');
      cy.get('[data-health=Error]').should('have.css', 'border-left-color', 'rgb(248, 81, 73)');
      cy.get('[data-health=Warning] input').uncheck();
      cy.get('[data-health=Warning]').should('not.have.class', 'enabled');
      cy.get('[data-health=Warning] input').check();
    });
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('app-tree-view .tree-health-filters').should('not.exist');
    cy.get('app-tree-view .filter-items-container app-toggle').should('have.length', 4);
  });

  it('renders modern node details and command safety groups', () => {
    cy.visit('/#/node/_nt_0');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=header]').should('contain', '_nt_0');
    cy.get('.essen-pane').first().should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('[data-cy=navtabs]').contains('commands').click();
    cy.get('[data-cy=safeCommands]').should('exist');
    cy.viewport(390, 1000);
    cy.get('[aria-label="SFX experience"]').should('be.visible');
  });

  it('uses the modern document viewer for application manifests', () => {
    cy.visit('/#/apptype/VisualObjectsApplicationType/app/VisualObjectsApplicationType');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=navtabs]').contains('manifest').click();
    cy.get('app-manifest-document').should('exist');
    cy.get('[aria-label="Find in manifest"]').type('Application');
    cy.get('app-manifest-document li.match').should('have.length.at.least', 1);
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('app-manifest-document').should('not.exist');
    cy.get('app-manifest-viewer code').should('exist');
  });
});
