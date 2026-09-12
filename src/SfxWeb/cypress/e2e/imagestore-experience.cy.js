/// <reference types="cypress" />

const store = '[data-cy=imagestore]';
const table = `${store} table.detail-list`;
const breadcrumb = `${store} nav[aria-label="Image Store folder path"]`;
const folderName = 'VisualObjectsApplicationType';
const folderPath = `StoreTest/${folderName}`;
const folderSizePath = `/ImageStore/${folderPath}/$/FolderSize`;
const helpUrl = 'https://aka.ms/sfx-help-imagestore-connectionstring';

const folderRow = name => cy.contains(`${table} button.image-store-item-name`,
  new RegExp(`^\\s*${Cypress._.escapeRegExp(name)}\\s*$`)).closest('tr');

const expectFolders = names => {
  cy.get(`${table} > tbody`).should(body => {
    const actual = [...body[0].querySelectorAll('button.image-store-item-name')]
      .map(button => button.textContent.trim()).sort();
    expect(actual, 'visible folder names').to.deep.equal([...names].sort());
  });
};

const openStoreTest = () => {
  folderRow('StoreTest').find('button.image-store-item-name').click();
  cy.wait('@nestedDirectory');
  expectFolders([folderName]);
};

const expectSize = value => {
  folderRow(folderName).find('app-display-size-column').should(column => {
    expect(column.text().trim(), 'exact folder size').to.equal(value);
  });
  folderRow(folderName).find('[title="Reload folder size"]').should('not.have.class', 'rotate');
  folderRow(folderName).find('[aria-label="timestamp"]').should('have.attr', 'title').and('not.be.empty');
};

describe('Image Store experience (fixtures only)', () => {
  beforeEach(() => {
    expect(Cypress.expose('API_PREFIX'), 'use the coordinated static server with no API prefix').to.equal('');

    // Match all XHR/fetch hosts and paths, not apiUrl('/**'), which becomes '//**'
    // with an empty API_PREFIX. Only the explicit fixtures below may answer requests.
    cy.intercept({ url: '**', resourceType: /^(xhr|fetch)$/ }, {
      statusCode: 501,
      body: { error: 'Unmatched request blocked by fixture-only Image Store spec' },
    }).as('unmatchedRequest');

    [
      ['GET', '/$/GetAadMetadata/', 'aad.json'],
      ['GET', '/Applications/', 'applications.json'],
      ['GET', '/ApplicationTypes/', 'appType.json'],
      ['GET', '/$/GetClusterHealth', 'clusterHealth.json'],
      // This POST is a read-only health query, not a cluster mutation.
      ['POST', '/$/GetClusterHealthChunk', 'clusterHealthChunk.json'],
      ['GET', '/$/GetClusterManifest', 'clusterManifest.json'],
      ['GET', '/Nodes/', 'nodes.json'],
      ['GET', '/Applications/System/$/GetHealth', 'systemApplicationHealth.json'],
      ['GET', '/$/GetUpgradeProgress', 'upgradeProgress.json'],
      ['GET', '/Applications/System/$/GetServices', 'systemApps.json'],
      ['GET', '/$/GetRepairTaskList', 'emptyRepairJobs.json'],
      ['GET', '/Applications/VisualObjectsApplicationType/', 'visualObjectsApplicationType.json'],
      ['GET', '/$/GetLoadInformation', 'cluster-page/upgrade/get-load-information.json'],
    ].forEach(([method, pathname, fixture]) => {
      cy.intercept({ method, pathname }, { fixture });
    });
    cy.intercept({ method: 'GET', pathname: '/ImageStore' }, {
      fixture: 'cluster-page/imagestore/base-directory.json',
    }).as('baseDirectory');
    cy.fixture('cluster-page/imagestore/nested-directory.json').then(directory => {
      cy.intercept({ method: 'GET', pathname: '/ImageStore/StoreTest' }, {
        body: {
          ...directory,
          StoreFolders: directory.StoreFolders.map(folder => ({ ...folder, StoreRelativePath: folderPath })),
        },
      }).as('nestedDirectory');
    });
    cy.intercept({ method: 'GET', pathname: `/ImageStore/${folderPath}` }, {
      body: { StoreFiles: [], StoreFolders: [], ContinuationToken: '' },
    }).as('applicationDirectory');
    cy.fixture('cluster-page/imagestore/load-size.json').then(size => {
      cy.intercept({ method: 'GET', pathname: folderSizePath }, {
        body: { ...size, StoreRelativePath: folderPath },
      }).as('folderSize');
    });

    cy.visit('/#/imagestore', {
      onBeforeLoad(win) {
        win.localStorage.setItem('sfxNewExperience', 'true');
        win.localStorage.setItem('sfxAutoRefreshIntervalV2', 'OFF');
        win.localStorage.setItem('sfx-telemetry-enabled', 'false');
        win.localStorage.setItem('sfx-telemetry-prompted', 'true');
      },
    });
    cy.wait('@baseDirectory');
    cy.get('body').should('have.class', 'sfx-new');
    expectFolders(['StoreTest', 'WindowsFabricStoreTest']);
    // FocusService focuses the page heading asynchronously on navigation.
    // Wait for that handoff so it cannot steal keystrokes from the search input.
    cy.get('h1[appfocusable]').should('be.focused');
  });

  afterEach(() => {
    // Unexpected reads and every mutation fail closed; none may reach a live proxy.
    cy.get('@unmatchedRequest.all').should(requests => {
      expect(requests.map(({ request }) => `${request.method} ${request.url}`),
        'requests without fixtures').to.deep.equal([]);
    });
  });

  it('links the actual connection string value to its documentation', () => {
    cy.fixture('clusterManifest.json').then(({ Manifest }) => {
      const manifest = new DOMParser().parseFromString(Manifest, 'application/xml');
      const connectionString = manifest.querySelector('Parameter[Name="ImageStoreConnectionString"]').getAttribute('Value');
      expect(connectionString.toLowerCase()).to.equal('fabric:imagestore');
      cy.get(`${store} .connection-property dt`).should('have.text', 'Connection String');
      cy.get(`${store} .connection-property dd > a`).should('have.text', connectionString)
        .and('have.attr', 'href', helpUrl).and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer');
    });
    cy.get(`${store} .connection-property .mif-info`).should('not.exist');
  });

  it('navigates folders, parent breadcrumbs and Root with the current location disabled', () => {
    cy.get(`${breadcrumb} button`).should('have.length', 1).and('have.text', 'Root')
      .and('be.disabled').and('have.attr', 'aria-current', 'location');
    openStoreTest();
    cy.get(`${breadcrumb} button`).should('have.length', 2);
    cy.contains(`${breadcrumb} button`, /^Root$/).should('be.enabled').and('not.have.attr', 'aria-current');
    cy.contains(`${breadcrumb} button`, /^StoreTest$/).should('be.disabled').and('have.attr', 'aria-current', 'location');

    folderRow(folderName).find('button.image-store-item-name').click();
    cy.wait('@applicationDirectory');
    expectFolders([]);
    cy.get(`${breadcrumb} button`).should('have.length', 3);
    cy.contains(`${breadcrumb} button`, folderName).should('be.disabled').and('have.attr', 'aria-current', 'location');
    cy.contains(`${breadcrumb} button`, /^StoreTest$/).should('be.enabled').click();
    cy.wait('@nestedDirectory');
    expectFolders([folderName]);
    cy.get(`${breadcrumb} button`).should('have.length', 2);

    cy.contains(`${breadcrumb} button`, /^Root$/).click();
    cy.wait('@baseDirectory');
    expectFolders(['StoreTest', 'WindowsFabricStoreTest']);
    cy.get(`${breadcrumb} button`).should('have.length', 1).and('be.disabled')
      .and('have.attr', 'aria-current', 'location');
  });

  it('loads and reloads exact folder sizes in currentFolder and preserves the refreshed snapshot', () => {
    openStoreTest();
    cy.get('@folderSize.all').should('have.length', 0);
    folderRow(folderName).contains('button', /^\s*Load Size\s*$/).click();
    cy.wait('@folderSize').its('response.body.FolderSize').should('equal', '18563403');
    expectSize('17.70 MB');
    folderRow(folderName).contains('button', 'Load Size').should('not.exist');

    cy.fixture('cluster-page/imagestore/load-size.json').then(size => {
      cy.intercept({ method: 'GET', pathname: folderSizePath }, {
        body: { ...size, StoreRelativePath: folderPath, FolderSize: '33554432' },
      }).as('reloadedFolderSize');
    });
    folderRow(folderName).find('[title="Reload folder size"]').click();
    cy.wait('@reloadedFolderSize').its('response.body.FolderSize').should('equal', '33554432');
    expectSize('32.00 MB');

    cy.contains(`${breadcrumb} button`, /^Root$/).click();
    cy.wait('@baseDirectory');
    openStoreTest();
    expectSize('32.00 MB');
    cy.get('@folderSize.all').should('have.length', 1);
    cy.get('@reloadedFolderSize.all').should('have.length', 1);
  });

  it('searches the current directory and restores all rows with Reset All', () => {
    const search = `${store} .list-toolbar app-input input`;
    cy.get(search).should('be.visible').and('have.value', '');
    cy.get(search).type('WindowsFabric');
    cy.get(search).should('be.focused').and('have.value', 'WindowsFabric');
    expectFolders(['WindowsFabricStoreTest']);
    cy.get(search).clear().type('no-such-image-store-folder');
    cy.get(search).should('have.value', 'no-such-image-store-folder');
    expectFolders([]);
    cy.contains(`${store} .list-toolbar button`, /^Reset All$/).click();
    cy.get(search).should('have.value', '');
    expectFolders(['StoreTest', 'WindowsFabricStoreTest']);
    cy.get(`${breadcrumb} button`).should('have.length', 1).and('have.text', 'Root');
    cy.get('@nestedDirectory.all').should('have.length', 0);
    cy.get('@folderSize.all').should('have.length', 0);
  });

  it('restores Classic configuration and breadcrumbs without losing the current folder', () => {
    openStoreTest();
    cy.setExperience('classic');
    cy.get(`${store} .connection-property, ${breadcrumb}`).should('not.exist');
    cy.get(`${store} .detail-table`).within(() => {
      cy.contains('th', 'Connection String').find('a').should('have.attr', 'href', helpUrl);
      cy.get('td').should(cell => expect(cell.text().trim().toLowerCase()).to.equal('fabric:imagestore'));
      cy.get('td a').should('not.exist');
    });
    cy.get(`${store} .image-store-breadcrumb`).should('be.visible').within(() => {
      cy.get('button[aria-label="click to go to root of image store"]')
        .should('contain.text', 'Image Store').and('be.enabled');
      cy.get('button[aria-label="click to open folder"]')
        .should('contain.text', 'StoreTest').and('be.disabled');
    });
    expectFolders([folderName]);
    cy.get(`${store} button[aria-label="click to go to root of image store"]`).click();
    cy.wait('@baseDirectory');
    expectFolders(['StoreTest', 'WindowsFabricStoreTest']);
    cy.get(`${store} button[aria-label="click to go to root of image store"]`).should('be.disabled');
    cy.get(`${table} .column-resizer`).should('not.exist');
  });
});
