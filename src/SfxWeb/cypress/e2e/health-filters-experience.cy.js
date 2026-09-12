/// <reference types="cypress" />

import { addDefaultFixtures, addRoute, apiUrl, nodes_route } from './util.cy';

const health = 'app-health-viewer app-detail-list';
const replicas = '[data-cy=replicas] app-detail-list';
const menu = 'body .table-filter-menu.show';
const filterButton = scope => `${scope} button[aria-label="Filter table"]`;
const search = scope => `${scope} .list-toolbar app-input input`;
const table = scope => `${scope} table.detail-list`;
const rawDescription = 'Replica has been created onSF_2.\nFor more information see: http://aka.ms/sfhealth';
const displayDescription = 'Replica has been created on SF_2.';
const properties = ['Certificate_client', 'Certificate_cluster', 'Certificate_server', 'RAStoreProvider', 'State'];
const appName = 'VisualObjectsApplicationType';
const serviceName = 'VisualObjects.ActorService';
const partitionId = '28bfaf73-37b0-467d-9d47-d011b0aedbc0';
const partitionRoute = `/Applications/${appName}/$/GetServices/${appName}%2F${serviceName}/$/GetPartitions`;
const replicaIds = ['132422367823912071', '132429154475414363', '132431356665040624', '132431356665040625', '132431356665040626'];
const groups = ['Node Name', 'Replica Role', 'Health State', 'Status'];

const option = (group, text) => cy.get(`${menu} ul[aria-label="${group}"] label`)
  .filter((index, label) => label.textContent.trim() === text).should('have.length', 1).find('input');

const expectRows = (scope, column, values) => {
  // Query tbody so an empty result is asserted without waiting for a nonexistent data row.
  cy.get(`${table(scope)} > tbody`).should(body => {
    const rows = [...body[0].querySelectorAll(':scope > tr.hover-row')];
    expect(rows.map(row => row.cells[column].textContent.trim()).sort(), 'visible row identities')
      .to.deep.equal([...values].sort());
  });
};

const expectToolbar = scope => {
  cy.get(`${scope} .list-toolbar`).scrollIntoView().should('be.visible').should(toolbar => {
    const button = toolbar[0].querySelector('button[aria-label="Filter table"]');
    const input = toolbar[0].querySelector('app-input input');
    expect(button, 'filter button').not.to.equal(null);
    expect(input, 'search input').not.to.equal(null);
    expect(button.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING, 'filter before search in DOM')
      .to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(button.getBoundingClientRect().right, 'filter before search on screen').to.be.at.most(input.getBoundingClientRect().left);
  });
  cy.get(filterButton(scope)).should('be.enabled').find('svg').should('have.attr', 'aria-hidden', 'true');
  cy.get(`${table(scope)} > thead button[aria-label="Filter"]`).should('not.exist');
};

const visitNew = path => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('sfxNewExperience', 'true');
    },
  });
  cy.get('body').should('have.class', 'sfx-new');
};

describe('Health and replica grouped filters (fixtures only)', () => {
  let mutations;

  beforeEach(() => {
    mutations = [];
    // No URL restriction: empty API_PREFIX must still fail closed, without blocking static assets.
    cy.intercept({ resourceType: /^(xhr|fetch)$/ }, { statusCode: 501, body: {} }).as('unmatchedApi');
    // Middleware runs before fixtures. The health-chunk POST is a read, not a mutation.
    cy.intercept({ resourceType: /^(xhr|fetch)$/, middleware: true }, request => {
      const isHealthChunkRead = request.method === 'POST'
        && /\/\$\/GetClusterHealthChunk$/.test(new URL(request.url).pathname);
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !isHealthChunkRead) {
        mutations.push(`${request.method} ${request.url}`);
        request.reply({ statusCode: 403, body: {} });
      }
    });
    addDefaultFixtures();
    cy.viewport(1800, 1100);
  });

  afterEach(() => {
    cy.get('@unmatchedApi.all').should('have.length', 0);
    cy.then(() => expect(mutations, 'mutation requests attempted').to.deep.equal([]));
  });

  describe('Node Health All', () => {
    beforeEach(() => {
      addRoute('healthNodes', 'node-page/Ok-nodes-list.json', nodes_route);
      addRoute('healthNode', 'node-page/node-info.json', apiUrl('/Nodes/_nt_0/?*'));
      addRoute('healthApps', 'node-page/apps.json', apiUrl('/Nodes/_nt_0/$/GetApplications?*'));
      addRoute('healthLoad', 'node-load/get-node-load-information.json', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'));
      cy.fixture('node-page/health.json').then(original => {
        const response = Cypress._.cloneDeep(original);
        response.HealthEvents[0].Description = rawDescription;
        response.HealthEvents[0].HealthState = 'Warning';
        response.HealthEvents[1].Description = 'Certificate needs renewal.\nFor more information see: https://aka.ms/sfhealth/';
        response.HealthEvents[1].HealthState = 'Error';
        response.HealthEvents[2].Description = 'Keep this reference: https://aka.ms/sfhealth in the report body.';
        response.AggregatedHealthState = 'Error';
        cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetHealth?*'), response).as('nodeHealth');
      });
      visitNew('/#/node/_nt_0');
      cy.wait(['@gethealthNode', '@nodeHealth', '@gethealthApps', '@gethealthLoad']);
      cy.contains('app-health-viewer .nav-link', /^All$/).click().should('have.class', 'active');
      expectRows(health, 2, properties);
    });

    it('renders inline descriptions without the help suffix or copy button and keeps Source UTC unwrapped', () => {
      cy.get(`${table(health)} > thead > tr > th`).eq(3).should('contain', 'Description');
      cy.get(`${table(health)} > tbody > tr`).should('have.length', properties.length);
      cy.get(`${health} app-health-description`).should('have.length', properties.length);
      cy.contains(`${health} app-health-description .message`, displayDescription)
        .should('have.text', displayDescription).and('have.css', 'white-space', 'pre-wrap');
      cy.contains(`${health} app-health-description .message`, 'Certificate needs renewal.')
        .should('have.text', 'Certificate needs renewal.');
      cy.contains(`${health} app-health-description .message`, 'Keep this reference:')
        .should('have.text', 'Keep this reference: https://aka.ms/sfhealth in the report body.');
      cy.get(`${health} app-health-description`).should('not.contain', 'For more information see:');
      cy.get(`${table(health)} > tbody > tr.hover-row > td:nth-child(4)`)
        .should('have.length', properties.length).find('app-clip-board, app-copy-text, a').should('not.exist');
      cy.get(`${health} .list-toolbar a`).should('have.length', 1)
        .and('have.text', 'Learn about SF Health Reports').and('have.attr', 'href', 'https://aka.ms/sfhealth');
      cy.get(`${health} .list-toolbar a`).should('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer');
      cy.get(`${table(health)} > thead > tr > th`).eq(4).should('contain', 'Source UTC').and('have.css', 'white-space', 'nowrap');
      cy.get(`${table(health)} > tbody > tr.hover-row > td:nth-child(5)`).should('have.length', properties.length).each(cell => {
        cy.wrap(cell).should('have.css', 'white-space', 'nowrap').find('app-utc-timestamp > div')
          .should('have.css', 'white-space', 'nowrap').find('app-display-time').should('not.be.empty');
      });
    });

    it('filters real health rows with Check All and search together, then resets both', () => {
      expectToolbar(health);
      cy.get(filterButton(health)).click().should('have.attr', 'aria-expanded', 'true');
      cy.get(menu).should('be.visible').find('.table-filter-group').should('have.length', 1);
      cy.get(`${menu} ul[aria-label="Health State"] label`).should(labels => {
        expect([...labels].map(label => label.textContent.trim())).to.deep.equal(['Check All', 'Error', 'OK', 'Warning']);
      });
      option('Health State', 'Check All').should('be.checked').uncheck();
      expectRows(health, 2, []);
      option('Health State', 'Warning').check();
      expectRows(health, 2, [properties[0]]);
      option('Health State', 'Check All').should('not.be.checked').and('have.prop', 'indeterminate', true);
      option('Health State', 'Check All').check();
      expectRows(health, 2, properties);
      option('Health State', 'OK').uncheck();
      expectRows(health, 2, properties.slice(0, 2));
      cy.get(filterButton(health)).should('have.class', 'link').click();
      cy.get(search(health)).type('Certificate_client');
      expectRows(health, 2, [properties[0]]);
      cy.get(search(health)).clear().type('RAStoreProvider');
      expectRows(health, 2, []);
      cy.contains(`${health} .list-toolbar button`, /^Reset All$/).click();
      cy.get(search(health)).should('have.value', '');
      expectRows(health, 2, properties);
      cy.get(filterButton(health)).should('not.have.class', 'link').click();
      cy.get(`${menu} input`).each(input => cy.wrap(input).should('be.checked'));
    });

    it('exports the original raw Description rather than the cleaned display text', () => {
      cy.get(search(health)).type('Certificate_client');
      expectRows(health, 2, [properties[0]]);
      cy.contains(`${health} .message`, displayDescription).should('have.text', displayDescription);
      cy.contains(`${health} .list-toolbar button`, /^\s*Export\s*$/).click();
      cy.get('app-export-modal .action-modal').should('be.visible').within(() => {
        cy.contains('[data-cy=columns] label', /^\s*Check All\s*$/).find('input[type=checkbox]').uncheck();
        cy.contains('[data-cy=columns] label', /^\s*Description\s*$/).find('input[type=checkbox]').check();
        cy.get('[data-cy=export]').click();
        cy.get('[aria-label="Exported csv content"] [data-cy=row]').should('have.length', 2).then(rows => {
          expect(rows[0].textContent).to.equal('Description');
          expect(rows[1].textContent).to.equal(rawDescription);
        });
        cy.contains('button', /^Cancel$/).click();
      });
      cy.get('app-export-modal').should('not.exist');
      cy.contains(`${health} .message`, displayDescription).should('have.text', displayDescription);
    });

    it('restores Classic second-row descriptions, copy controls and the health header filter', () => {
      cy.setExperience('classic');
      cy.contains('app-health-viewer .nav-link', /^All$/).should('have.class', 'active');
      expectRows(health, 2, properties);
      cy.get(`${health}.modern-health-events, ${health} app-health-description, ${health} .column-resizer`).should('not.exist');
      cy.get(filterButton(health)).should('not.exist');
      cy.get(`${health} .list-toolbar-extra`).should('not.exist');
      cy.get(`${table(health)} > thead > tr > th`).should('have.length', 8);
      cy.get(`${table(health)} > thead`).should('not.contain', 'Description');
      cy.get(`${table(health)} > tbody > tr:not(.hover-row)`).should('have.length', properties.length);
      cy.get(`${health} app-copy-text app-clip-board`).should('have.length', properties.length);
      cy.contains(`${health} app-copy-text p`, 'Replica has been created onSF_2.')
        .should('contain', 'For more information see: http://aka.ms/sfhealth');
      cy.get(`${table(health)} > thead button[aria-label="Filter"]`).should('have.length', 1).click();
      cy.get(`${menu} .table-filter-group`).should('not.exist');
      cy.get(`${menu} label`).filter((index, label) => label.textContent.trim() === 'Warning').find('input').uncheck();
      expectRows(health, 2, properties.slice(1));
    });
  });

  describe('Partition Replicas', () => {
    beforeEach(() => {
      addRoute('filterServices', 'app-page/services.json', apiUrl(`/Applications/${appName}/$/GetServices?*`));
      addRoute('filterPartitions', 'partition-page/partitions.json', apiUrl(`${partitionRoute}?*`));
      addRoute('filterPartition', 'partition-page/stateful-partition-info.json', apiUrl(`${partitionRoute}/${partitionId}?*`));
      addRoute('filterPartitionHealth', 'partition-page/health.json', apiUrl(`${partitionRoute}/${partitionId}/$/GetHealth?*`));
      addRoute('filterPartitionLoad', 'partition-page/load.json', apiUrl(`${partitionRoute}/${partitionId}/$/GetLoadInformation?*`));
      addRoute('filterReplicaDetail', 'partition-page/replica-detail.json', apiUrl(`/Nodes/_nt_1/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaIds[1]}/$/GetDetail?*`));
      cy.fixture('partition-page/replicas.json').then(original => {
        const response = Cypress._.cloneDeep(original);
        response.Items[2].ReplicaStatus = 'Down';
        // Independent role/status/node combinations make accidental OR filtering observable.
        response.Items.push(
          { ...response.Items[0], ReplicaId: replicaIds[3], NodeName: '_nt_2', HealthState: 'Warning' },
          { ...response.Items[0], ReplicaId: replicaIds[4], NodeName: '_nt_0', HealthState: 'Warning', ReplicaStatus: 'Down' },
        );
        cy.intercept('GET', apiUrl(`${partitionRoute}/${partitionId}/$/GetReplicas?*`), response).as('filterReplicas');
      });
      visitNew(`/#/apptype/${appName}/app/${appName}/service/${appName}%252F${serviceName}/partition/${partitionId}`);
      cy.wait(['@getfilterPartition', '@getfilterPartitionHealth', '@filterReplicas']);
      expectRows(replicas, 0, replicaIds);
      expectToolbar(replicas);
    });

    it('places all four filter groups in a real 2-by-2 grid and makes each Check All affect rows', () => {
      cy.get(filterButton(replicas)).click().should('have.attr', 'aria-expanded', 'true');
      cy.get(menu).should('be.visible').and('have.css', 'display', 'grid');
      cy.get(`${menu} .table-filter-group`).should('have.length', 4).should(fieldsets => {
        expect([...fieldsets].map(group => group.querySelector('legend').textContent.trim())).to.deep.equal(groups);
        const bounds = [...fieldsets].map(group => group.getBoundingClientRect());
        bounds.forEach(rect => {
          expect(rect.width, 'group width').to.be.greaterThan(0);
          expect(rect.height, 'group height').to.be.greaterThan(0);
        });
        expect(bounds[0].top).to.be.closeTo(bounds[1].top, 1);
        expect(bounds[2].top).to.be.closeTo(bounds[3].top, 1);
        expect(bounds[0].left).to.be.closeTo(bounds[2].left, 1);
        expect(bounds[1].left).to.be.closeTo(bounds[3].left, 1);
        expect(bounds[1].left - bounds[0].right, 'column gap').to.be.at.least(10);
        expect(bounds[2].top - Math.max(bounds[0].bottom, bounds[1].bottom), 'row gap').to.be.at.least(10);
      });
      groups.forEach(group => {
        option(group, 'Check All').should('be.checked').uncheck();
        expectRows(replicas, 0, []);
        option(group, 'Check All').check();
        expectRows(replicas, 0, replicaIds);
      });
      cy.get(filterButton(replicas)).should('not.have.class', 'link');
    });

    it('intersects all four replica filters and search, resets rows, and restores Classic header filters', () => {
      cy.get(filterButton(replicas)).click();
      option('Health State', 'OK').uncheck();
      option('Health State', 'Error').uncheck();
      expectRows(replicas, 0, [replicaIds[1], replicaIds[3], replicaIds[4]]);
      option('Replica Role', 'Primary').uncheck();
      expectRows(replicas, 0, replicaIds.slice(3));
      option('Status', 'Down').uncheck();
      expectRows(replicas, 0, [replicaIds[3]]);
      option('Node Name', '_nt_2').uncheck();
      expectRows(replicas, 0, []);
      option('Node Name', 'Check All').check();
      expectRows(replicas, 0, [replicaIds[3]]);
      cy.get(filterButton(replicas)).should('have.class', 'link').click();
      cy.get(search(replicas)).type('_nt_2');
      expectRows(replicas, 0, [replicaIds[3]]);
      cy.get(search(replicas)).clear().type('_nt_1');
      expectRows(replicas, 0, []);
      cy.contains(`${replicas} .list-toolbar button`, /^Reset All$/).click();
      cy.get(search(replicas)).should('have.value', '');
      expectRows(replicas, 0, replicaIds);
      cy.get(filterButton(replicas)).should('not.have.class', 'link').click();
      cy.get(`${menu} input`).each(input => cy.wrap(input).should('be.checked'));
      cy.get(filterButton(replicas)).click();

      cy.setExperience('classic');
      expectRows(replicas, 0, replicaIds);
      cy.get(filterButton(replicas)).should('not.exist');
      cy.get(`${replicas} .column-resizer`).should('not.exist');
      cy.get(`${table(replicas)} > thead button[aria-label="Filter"]`).should('have.length', 4);
      groups.forEach(group => cy.get(`${table(replicas)} > thead button[title="filter by ${group} options"]`).should('exist'));
      cy.get(`${table(replicas)} > thead button[title="filter by Status options"]`).click();
      cy.get(menu).should('be.visible').and('not.have.class', 'table-filter-grid');
      cy.get(`${menu} .table-filter-group`).should('not.exist');
      cy.get(`${menu} label`).filter((index, label) => label.textContent.trim() === 'Down').find('input').uncheck();
      expectRows(replicas, 0, [replicaIds[0], replicaIds[1], replicaIds[3]]);
    });
  });
});
