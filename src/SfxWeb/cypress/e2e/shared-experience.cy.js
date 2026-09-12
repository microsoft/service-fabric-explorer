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
    cy.setExperience('new');
    cy.get('body').should('have.class', 'sfx-new');
    cy.get('.header-bar').should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('table.detail-list').first().should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('.list-toolbar .simple-button').first().should('have.css', 'background-color', 'rgb(33, 38, 45)');
    cy.setExperience('classic');
    cy.get('body').should('not.have.class', 'sfx-new');
    cy.get('.header-bar').should('have.css', 'background-color', 'rgb(38, 38, 38)');
  });

  it('themes export dialogs outside the routed page', () => {
    cy.visit('/#/nodes');
    cy.setExperience('new');
    cy.contains('app-detail-list button', 'Export').first().click();
    cy.get('.cdk-overlay-container .action-modal').should('be.visible').and('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('.cdk-overlay-container .modal-header').should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.contains('.cdk-overlay-container button', 'Cancel').click();
    cy.get('.cdk-overlay-container .action-modal').should('not.exist');
  });

  it('uses wider rounded popup menus separated from their trigger', () => {
    cy.visit('/#/');
    cy.setExperience('new');
    cy.get('app-advanced-option [ngbDropdownToggle]').click();
    cy.get('app-advanced-option .dropdown-menu.show').should(menu => {
      expect(getComputedStyle(menu[0]).borderRadius).to.equal('10px');
      expect(getComputedStyle(menu[0]).marginTop).to.equal('8px');
      expect(menu[0].getBoundingClientRect().width).to.be.at.least(280);
    });
  });

  it('filters tree health through a body-mounted menu and restores classic toggles', () => {
    cy.visit('/#/nodes');
    cy.setExperience('new');
    cy.get('button[aria-label="Filter tree by health"]').should('contain', '3 / 3').click();
    cy.get('body .tree-health-menu.show').should('be.visible').within(() => {
      cy.get('app-toggle, app-health-badge').should('not.exist');
      cy.get('[data-health=OK] input').should('have.css', 'accent-color', 'rgb(63, 185, 80)');
      cy.get('[data-health=Warning] input').should('have.css', 'accent-color', 'rgb(210, 153, 34)');
      cy.get('[data-health=Error] input').should('have.css', 'accent-color', 'rgb(248, 81, 73)');
      cy.get('.tree-health-option').should('have.length', 3);
      cy.get('[data-health=Warning] input').uncheck();
      cy.get('[data-health=Warning] input').should('not.be.checked');
    });
    cy.get('button[aria-label="Filter tree by health"]').should('contain', '2 / 3');
    cy.get('body .tree-health-menu.show [data-health=Warning] input').check().should('be.checked');
    cy.get('button[aria-label="Filter tree by health"]').should('contain', '3 / 3').click().should('have.attr', 'aria-expanded', 'false');
    cy.get('.tree-health-menu.show').should('not.exist');
    cy.get('app-tree-view .tree-health-sort input').check().should('be.checked').uncheck().should('not.be.checked');
    cy.setExperience('classic');
    cy.get('button[aria-label="Filter tree by health"]').should('not.exist');
    cy.get('app-tree-view .filter-items-container app-toggle').should('have.length', 4);
  });

  it('keeps compact sidebar controls inside the header at different widths', () => {
    cy.visit('/#/nodes');
    cy.setExperience('new');
    [340, 650].forEach(width => {
      cy.get('app-tree-view .tree-header').invoke('css', 'width', `${width}px`);
      cy.get('app-tree-view .tree-header').should(header => {
        const bounds = header[0].getBoundingClientRect();
        const input = header[0].querySelector('input[type=text]');
        const toolbar = header[0].querySelector('.tree-filter-toolbar');
        [input, toolbar].forEach(control => {
          const box = control.getBoundingClientRect();
          expect(box.width).to.be.closeTo(Math.min(bounds.width - 24, 480), 1);
          expect(box.left).to.be.at.least(bounds.left);
          expect(box.right).to.be.at.most(bounds.right);
        });
        const trigger = toolbar.querySelector('.tree-health-trigger').getBoundingClientRect();
        const sort = toolbar.querySelector('.tree-health-sort').getBoundingClientRect();
        expect(sort.left - trigger.right).to.be.at.least(8);
        expect(input.getBoundingClientRect().top).to.be.at.least(toolbar.getBoundingClientRect().bottom);
      });
    });
    cy.get('app-tree-view .tree-header').invoke('css', 'width', '');
  });

  it('renders modern node details and command safety groups', () => {
    cy.visit('/#/node/_nt_0');
    cy.setExperience('new');
    cy.get('[data-cy=header]').should('contain', '_nt_0');
    cy.get('.essen-pane').first().should('have.css', 'background-color', 'rgb(22, 27, 34)');
    cy.get('[data-cy=navtabs]').contains('commands').click();
    cy.get('[data-cy=safeCommands]').should('exist');
    cy.viewport(390, 1000);
    cy.get('button[aria-label="SFX experience"]').should('be.visible');
  });

  it('uses the modern document viewer for application manifests', () => {
    cy.visit('/#/apptype/VisualObjectsApplicationType/app/VisualObjectsApplicationType');
    cy.setExperience('new');
    cy.get('[data-cy=navtabs]').contains('manifest').click();
    cy.get('app-manifest-document').should('exist');
    cy.get('[aria-label="Find in manifest"]').type('Application');
    cy.get('app-manifest-document li.match').should('have.length.at.least', 1);
    cy.setExperience('classic');
    cy.get('app-manifest-document').should('not.exist');
    cy.get('app-manifest-viewer code').should('exist');
  });

  it('flattens nested Details properties and restores Classic styling', () => {
    const app = 'VisualObjectsApplicationType';
    const service = 'VisualObjects.ActorService';
    const base = `/Applications/${app}/$/GetServices/${app}%2F${service}`;
    addRoute('serviceInfo', 'service-page/service-info.json', apiUrl(`${base}?*`));
    addRoute('serviceDescription', 'service-page/service-description.json', apiUrl(`${base}/$/GetDescription?*`));
    addRoute('servicePartitions', 'service-page/service-partitions.json', apiUrl(`${base}/$/GetPartitions?*`));
    addRoute('serviceHealth', 'service-page/service-health.json', apiUrl(`${base}/$/GetHealth?*`));
    cy.visit(`/#/apptype/${app}/app/${app}/service/${app}%252F${service}/details`);
    cy.setExperience('new');
    cy.contains('[data-cy=serviceDescription] summary', 'Partition Description').should('have.css', 'font-size', '15px').click();
    cy.get('[data-cy=serviceDescription] [aria-label="Partition Description"]').should('have.attr', 'open');
    cy.get('[data-cy=serviceDescription] .nested-table-container, [data-cy=serviceDescription] .table-responsive').should('not.exist');
    cy.get('[data-cy=serviceDescription] .property-row, [data-cy=serviceDescription] .property-section').each(element => {
      expect(element).to.have.css('border-top-width', '0px');
      expect(element).to.have.css('border-bottom-width', '0px');
    });
    cy.get('[data-cy=serviceDescription] .property-row dt').each(label => {
      expect(label).to.have.css('background-color', 'rgba(0, 0, 0, 0)');
      expect(label).to.have.css('color', 'rgb(139, 148, 158)');
      expect(label).to.have.css('font-weight', '400');
    });
    cy.contains('[data-cy=serviceDescription] dt', 'Application Name').then(label => {
      cy.contains('[data-cy=serviceDescription] dt', 'Partition Scheme').should(nested => {
        expect(nested[0].getBoundingClientRect().left - label[0].getBoundingClientRect().left).to.be.closeTo(24, 1);
      });
    });
    cy.viewport(390, 1000);
    cy.get('[data-cy=serviceDescription]').should(card => expect(card[0].scrollWidth).to.be.at.most(card[0].clientWidth + 1));
    cy.setExperience('classic');
    cy.contains('[data-cy=serviceDescription] h3', 'Partition Description').should('exist');
    cy.get('[data-cy=serviceDescription] .nested-table-container').first().should('not.have.css', 'padding-left', '0px');
  });

  it('renders record arrays, zero and false values in the new property sheet', () => {
    const app = 'VisualObjectsApplicationType';
    const service = 'VisualObjects.ActorService';
    const base = `/Applications/${app}/$/GetServices/${app}%2F${service}`;
    addRoute('serviceInfo', 'service-page/service-info.json', apiUrl(`${base}?*`));
    cy.fixture('service-page/service-description.json').then(description => {
      cy.intercept('GET', apiUrl(`${base}/$/GetDescription?*`), {
        ...description,
        TestRecords: [{ Name: 'first', Count: 0, Enabled: false }, { Name: 'second', Extra: 'later-column' }]
      });
    });
    cy.visit(`/#/apptype/${app}/app/${app}/service/${app}%252F${service}/details`);
    cy.setExperience('new');
    cy.get('[aria-label="Test Records"] > summary').click();
    cy.get('[aria-label="Test Records"]').should('have.attr', 'open');
    cy.get('[aria-label="Test Records"] .property-record-table').within(() => {
      cy.get('th').should('have.length', 4);
      cy.get('tbody tr').should('have.length', 2);
      cy.get('tbody tr').first().should('contain', '0').and('contain', 'false');
      cy.get('tbody tr').last().should('contain', 'later-column');
    });
    cy.viewport(390, 1000);
    cy.get('[aria-label="Test Records"] .property-records').should('have.css', 'overflow-x', 'auto').scrollTo('right');
    cy.get('[data-cy=serviceDescription]').should(card => expect(card[0].scrollWidth).to.be.at.most(card[0].clientWidth + 1));
  });

  ['node', 'application', 'service'].forEach(resource => {
    it(`uses full-width overview grids for ${resource} resources`, () => {
      const app = 'VisualObjectsApplicationType';
      const service = 'VisualObjects.ActorService';
      const base = `/Applications/${app}/$/GetServices/${app}%2F${service}`;
      addRoute('serviceInfo', 'service-page/service-info.json', apiUrl(`${base}?*`));
      addRoute('serviceDescription', 'service-page/service-description.json', apiUrl(`${base}/$/GetDescription?*`));
      addRoute('servicePartitions', 'service-page/service-partitions.json', apiUrl(`${base}/$/GetPartitions?*`));
      addRoute('serviceHealth', 'service-page/service-health.json', apiUrl(`${base}/$/GetHealth?*`));
      const appPath = `/#/apptype/${app}/app/${app}`;
      cy.viewport(2400, 1200);
      cy.visit(resource === 'node' ? '/#/node/_nt_0' : resource === 'application' ? appPath : `${appPath}/service/${app}%252F${service}`);
      cy.setExperience('new');
      cy.get('app-essential-health-tile .resource-summary').first().should('be.visible').and('contain', 'Overview');
      cy.get('app-essential-health-tile').each(card => {
        const bounds = card[0].getBoundingClientRect();
        expect(bounds.width).to.be.greaterThan(720);
        expect(bounds.width).to.be.closeTo(card[0].parentElement.getBoundingClientRect().width, 1);
      });
      cy.get('.resource-summary .overview-property-grid').should('have.css', 'display', 'grid');
      cy.get('.resource-summary .overview-property-grid').first().children().should(properties => {
        const columns = new Set([...properties].map(property => Math.round(property.getBoundingClientRect().left)));
        expect(columns.size, 'desktop overview columns').to.be.greaterThan(1);
      });
      cy.get('.resource-summary .overview-property-grid > div').each(property => {
        const label = property[0].querySelector('dt').getBoundingClientRect();
        const value = property[0].querySelector('dd').getBoundingClientRect();
        expect(value.left).to.be.closeTo(label.left, 1);
        expect(value.top).to.be.at.least(label.bottom);
      });
      cy.get('.resource-summary .overview-property-grid dd:has(app-clip-board)').each(row => {
        const value = row[0].querySelector('span').getBoundingClientRect();
        const copy = row[0].querySelector('app-clip-board').getBoundingClientRect();
        expect(copy.left - value.right).to.be.within(0, 12);
      });
      cy.get('app-navbar .detail-view-title-bar').should('have.css', 'border-bottom-width', '0px');
      cy.get('app-navbar .detail-view-navbar').should(nav => {
        expect(nav).to.have.css('border-bottom-width', '1px');
        expect(nav).to.have.css('border-bottom-color', 'rgb(48, 54, 61)');
        const active = nav[0].querySelector('.current');
        expect(active.getBoundingClientRect().bottom).to.be.closeTo(nav[0].getBoundingClientRect().bottom, 1);
        expect(nav[0].getBoundingClientRect().width).to.be.greaterThan(720);
      });
      cy.get('.essen-pane:has(app-health-viewer)').first().should(card => expect(card[0].getBoundingClientRect().width).to.be.greaterThan(720));
      cy.viewport(390, 1000);
      cy.get('.resource-summary').should(cards => [...cards].forEach(card => expect(card.scrollWidth).to.be.at.most(card.clientWidth + 1)));
      cy.get('.resource-summary .overview-property-grid').first().children().should(properties => {
        const columns = new Set([...properties].map(property => Math.round(property.getBoundingClientRect().left)));
        expect(columns.size, 'mobile overview columns').to.equal(1);
      });
      cy.setExperience('classic');
      cy.get('.resource-summary').should('not.exist');
      cy.get('app-essential-health-tile .dashboard').should('exist');
    });
  });
});
