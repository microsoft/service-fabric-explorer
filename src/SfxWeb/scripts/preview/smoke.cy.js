describe('Snapshot preview', () => {
  // SFX disables initial routing in embedded frames. Cypress embeds the app; reviewers do not.
  beforeEach(() => {
    cy.on('window:before:load', win => Object.defineProperty(win, 'opener', { value: win, configurable: true }));
  });
  for (const route of ['/', '/details', '/metrics', '/manifest', '/events', '/repairtasks', '/nodes', '/apps']) {
    it(`loads ${route} without API or external network traffic`, () => {
      const unexpected = [];
      cy.intercept('**', req => {
        if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
          if (!req.url.endsWith('/preview/snapshot.json')) unexpected.push(req.url);
        }
      });
      cy.visit('/#' + route);
      cy.get('#snapshot-banner').should('contain', 'Read-only snapshot');
      cy.get('app-root header').should('be.visible');
      cy.get('app-navbar', { timeout: 20000 }).should('exist');
      cy.wait(1000);
      cy.window().then(async win => {
        const blocked = await win.sfxSnapshotRequest({ method: 'POST', url: '/Nodes/test/$/Restart' });
        expect(blocked.statusCode).to.equal(403);
        expect(unexpected).to.deep.equal([]);
        const missing = [...win.sfxSnapshotMissing].filter(key => !key.includes('/Restart'));
        cy.log('Uncaptured queries: ' + JSON.stringify(missing));
        if (route === '/' || route === '/details' || route === '/metrics') expect(missing).to.deep.equal([]);
      });
      cy.screenshot(route === '/' ? 'overview' : route.substring(1), { capture: 'viewport' });
    });
  }
  it('navigates from Applications through the captured app to both services', () => {
    cy.request('/preview/snapshot.json').then(({ body: snapshot }) => {
      const app = snapshot.entries['GET /Applications'].data.Items[0];
      expect(app, 'captured application').to.exist;
      const services = snapshot.entries[`GET /Applications/${encodeURIComponent(app.Id)}/$/GetServices`].data.Items;
      expect(services.length, 'captured services').to.be.greaterThan(0);
      const row = name => cy.get('[data-cy="tree"] a.node[role="treeitem"]').filter((_, element) =>
        [...element.querySelectorAll('div[title]')].some(label => label.getAttribute('title') === name));
      const expand = name => row(name).then($row => {
        if ($row.attr('aria-expanded') !== 'true') cy.wrap($row).find('button.expander[title="Expand Children"]').click();
      });
      cy.visit('/#/apps');
      cy.get('.main-content').should('contain', app.Name);
      expand('Applications');
      expand(app.TypeName);
      expand(app.Name);
      for (const service of services) row(service.Name).should('be.visible');
      row(app.Name).click();
      cy.location('hash').should('contain', '/app/' + app.Id);
      cy.get('.main-content').should('contain', services[0].Name);
      row(services[0].Name).click();
      cy.location('hash').should('contain', '/service/');
      cy.get('.main-content').should('contain', services[0].Name);
      cy.window().then(win => expect([...win.sfxSnapshotMissing]).to.deep.equal([]));
      cy.screenshot('application-service-tree', { capture: 'viewport' });
    });
  });
  it('loads on a narrow viewport', () => {
    cy.viewport(390, 844);
    cy.visit('/#/');
    cy.get('app-root header').should('be.visible');
    cy.get('#snapshot-banner').should('be.visible');
    cy.screenshot('mobile', { capture: 'viewport' });
  });
  it('shows captured Naming Viewer metrics, not just the page shell', () => {
    cy.visit('/#/naming');
    cy.get('app-naming-viewer-page app-event-store').should('exist');
    cy.get('app-naming-viewer .naming-chart-caption').should('contain', 'reports across');
    cy.get('app-naming-viewer [data-cy="metric"]').should('have.length', 3);
    cy.window().then(win => expect([...win.sfxSnapshotMissing]).to.deep.equal([]));
    cy.contains('app-naming-viewer app-timeseries a', /^Data$/).click();
    cy.get('app-naming-viewer .series-data tbody > tr.hover-row').should('have.length.greaterThan', 0);
    cy.screenshot('naming-metrics', { capture: 'viewport' });
  });
});
