/// <reference types="cypress" />

import { addDefaultFixtures, addRoute, apiUrl, nodes_route } from './util.cy';

const apps = '[data-cy=appsList]';
const table = `${apps} table.detail-list`;
const headers = `${table} > thead > tr > th`;
const nameResizer = `${headers} .column-resizer[aria-label="Resize Name column"]`;
const filterButton = `${apps} button[aria-label="Filter table"]`;
const menu = 'body .table-filter-menu.show';
const appNames = ['fabric:/Alpha', 'fabric:/Bravo', 'fabric:/Charlie'];

const filterOption = (group, text) => cy.get(`${menu} ul[aria-label="${group}"] label`)
  .filter((index, label) => label.textContent.trim() === text).should('have.length', 1).find('input');

const visitNew = path => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('sfxNewExperience', 'true');
    },
  });
  cy.get('body').should('have.class', 'sfx-new');
};

const expectApps = names => {
  cy.get(`${table} > tbody`).should(body => {
    const rows = [...body[0].querySelectorAll('tr.hover-row')];
    expect(rows.map(row => row.cells[0].textContent.trim()).sort()).to.deep.equal([...names].sort());
  });
};

const expectWidths = (before, increase) => {
  cy.get(headers).should(columns => {
    expect(columns).to.have.length(before.length);
    [...columns].forEach((column, index) => {
      expect(column.getBoundingClientRect().width, `column ${index} rendered width`)
        .to.be.closeTo(before[index] + (index === 0 ? increase : 0), 1);
    });
  });
};

describe('Table controls experience (fixtures only)', () => {
  beforeEach(() => {
    // Block unmatched API traffic, but allow the static document and scripts when API_PREFIX is empty.
    cy.intercept({ url: apiUrl('/**'), resourceType: /^(xhr|fetch)$/ }, { statusCode: 501, body: {} }).as('unmatchedApi');
    addDefaultFixtures();
    cy.viewport(1800, 1100);
  });

  afterEach(() => {
    cy.get('@unmatchedApi.all').should('have.length', 0);
  });

  describe('Node deployed applications', () => {
    beforeEach(() => {
      addRoute('tableNodes', 'node-page/Ok-nodes-list.json', nodes_route);
      addRoute('tableNode', 'node-page/node-info.json', apiUrl('/Nodes/_nt_0/?*'));
      addRoute('tableNodeHealth', 'node-page/health.json', apiUrl('/Nodes/_nt_0/$/GetHealth?*'));
      addRoute('tableNodeLoad', 'node-load/get-node-load-information.json', apiUrl('/Nodes/_nt_0/$/GetLoadInformation?*'));
      cy.fixture('node-page/apps.json').then(original => {
        const deployed = appNames.map((Name, index) => ({
          ...original[0],
          Id: Name.slice('fabric:/'.length),
          Name,
          Status: index === 2 ? 'Upgrading' : 'Active',
        }));
        cy.intercept('GET', apiUrl('/Nodes/_nt_0/$/GetApplications?*'), deployed).as('deployedApps');
        cy.fixture('clusterHealthChunk.json').then(originalChunk => {
          const chunk = Cypress._.cloneDeep(originalChunk);
          // Keep raw.HealthState=Unknown: this table must filter the separately merged health.healthState.
          chunk.NodeHealthStateChunks.Items.find(node => node.NodeName === '_nt_0').DeployedApplicationHealthStateChunks = {
            TotalCount: deployed.length,
            Items: deployed.map((app, index) => ({
              ApplicationName: app.Name,
              HealthState: index === 0 ? 'Ok' : 'Warning',
              DeployedServicePackageHealthStateChunks: { TotalCount: 0, Items: [] },
            })),
          };
          cy.intercept('POST', apiUrl('/$/GetClusterHealthChunk?*'), chunk).as('tableHealthChunk');
        });
      });
      visitNew('/#/node/_nt_0');
      cy.wait(['@gettableNodeHealth', '@gettableNodeLoad', '@deployedApps', '@tableHealthChunk']);
      expectApps(appNames);
      cy.get(table).scrollIntoView().should('be.visible');
      cy.document().then(doc => doc.fonts.ready);
    });

    it('resizes rendered columns by 20px with arrow keys and restores automatic widths with Home', () => {
      cy.get(table).should('not.have.class', 'columns-resized').and('have.css', 'table-layout', 'auto');
      cy.get(headers).should('have.length', 4).each(header => {
        const displayName = header.find('.header-wrapper > button').text().trim();
        cy.wrap(header).find('.column-resizer').should('have.length', 1)
          .and('have.attr', 'role', 'separator')
          .and('have.attr', 'aria-label', `Resize ${displayName} column`)
          .and('have.attr', 'aria-orientation', 'vertical')
          .and('have.attr', 'tabindex', '0');
      });
      cy.get(headers).then(columns => {
        const before = [...columns].map(column => column.getBoundingClientRect().width);
        const sort = [...columns].map(column => column.getAttribute('aria-sort'));
        cy.get(nameResizer).scrollIntoView().focus().should('be.focused');
        cy.get(nameResizer).type('{rightarrow}');
        expectWidths(before, 20);
        cy.get(table).should('have.class', 'columns-resized').and('have.css', 'table-layout', 'fixed');
        cy.get(nameResizer).type('{rightarrow}');
        expectWidths(before, 40);
        cy.get(nameResizer).type('{leftarrow}');
        expectWidths(before, 20);
        cy.get(headers).should(current => {
          expect([...current].map(column => column.getAttribute('aria-sort'))).to.deep.equal(sort);
        });
        cy.get(nameResizer).type('{home}');
        cy.get(table).should('not.have.class', 'columns-resized').and('have.css', 'table-layout', 'auto');
        cy.get(table).should(current => expect(current[0].style.width).to.equal(''));
        cy.get(`${table} > colgroup`).should('not.exist');
        expectWidths(before, 0);
        cy.get(nameResizer).should('be.focused');
      });
      expectApps(appNames);
    });

    it('reflows the New health All description when resized with arrow keys and restores its cap with Home', () => {
      const healthTable = 'app-health-viewer .modern-health-events table.detail-list';
      const descriptionResizer = `${healthTable} .column-resizer[aria-label="Resize Description column"]`;
      const message = `${healthTable} app-health-description .message`;

      cy.fixture('node-page/health.json').then(health => {
        const description = health.HealthEvents[0].Description;
        cy.contains('app-health-viewer .nav-link', /^All$/).click().should('have.class', 'active');
        cy.get(healthTable).should('not.have.class', 'columns-resized');
        cy.contains(message, description).scrollIntoView().should('be.visible')
          .and('have.text', description).and('have.css', 'max-width', '240px').should(elements => {
            const bounds = elements[0].getBoundingClientRect();
            expect(bounds.width, 'initial message width').to.be.greaterThan(0).and.at.most(240);
            expect(bounds.height, 'initial wrapped message height').to.be.greaterThan(0);
          }).then(elements => {
            const before = elements[0].getBoundingClientRect();
            cy.get(descriptionResizer).scrollIntoView().focus().should('be.focused')
              .type('{rightarrow}'.repeat(20));
            cy.get(healthTable).should('have.class', 'columns-resized');
            cy.contains(message, description).should('have.text', description).should(current => {
              const bounds = current[0].getBoundingClientRect();
              expect(bounds.width, 'resized message exceeds the original cap').to.be.greaterThan(240);
              expect(bounds.width, 'message grows with the Description column').to.be.greaterThan(before.width);
              expect(bounds.height, 'message wraps onto fewer lines').to.be.lessThan(before.height);
            });

            cy.get(descriptionResizer).type('{home}');
            cy.get(healthTable).should('not.have.class', 'columns-resized');
            cy.contains(message, description).should('have.text', description)
              .and('have.css', 'max-width', '240px').should(current => {
                const bounds = current[0].getBoundingClientRect();
                expect(bounds.width, 'restored message cap').to.be.at.most(240);
                expect(bounds.width, 'restored message width').to.be.closeTo(before.width, 1);
                expect(bounds.height, 'restored message wrapping').to.be.closeTo(before.height, 1);
              });
            cy.get(descriptionResizer).should('be.focused');
          });
      });
    });

    it('captures a real pointer drag, grows only its column, and restores the original Classic layout', () => {
      // Native input is needed: synthetic pointerdown cannot establish browser pointer capture.
      expect(Cypress.isBrowser({ family: 'chromium' }), 'run pointer coverage in Chrome, Edge or Electron').to.equal(true);
      cy.setExperience('classic');
      cy.get(headers).then(classicColumns => {
        const classicWidths = [...classicColumns].map(column => column.getBoundingClientRect().width);
        cy.setExperience('new');
        cy.get(table).scrollIntoView().should('be.visible').then(current => {
          const tableWidth = current[0].getBoundingClientRect().width;
          cy.get(headers).then(columns => {
            const before = [...columns].map(column => column.getBoundingClientRect().width);
            cy.get(nameResizer).scrollIntoView().should('be.visible').then(handles => {
              const handle = handles[0];
              const win = handle.ownerDocument.defaultView;
              const bounds = handle.getBoundingClientRect();
              const x = bounds.left + bounds.width / 2;
              const y = bounds.top + bounds.height / 2;
              expect(handle.ownerDocument.elementFromPoint(x, y), 'uncovered resize handle').to.equal(handle);
              // The AUT has a different origin; frameElement is null from inside it.
              const frame = window.top.document.querySelector('iframe.aut-iframe').getBoundingClientRect();
              const scale = frame.width / win.innerWidth;
              const origin = { x: frame.left + x * scale, y: frame.top + y * scale };
              const end = { x: origin.x + 80 * scale, y: origin.y + (bounds.height + 30) * scale };
              let pointerId;
              handle.addEventListener('pointerdown', event => { pointerId = event.pointerId; }, { once: true });
              const move = cy.spy().as('capturedMove');
              const send = params => Cypress.automation('remote:debugger:protocol', {
                command: 'Input.dispatchMouseEvent',
                params: { pointerType: 'mouse', ...params },
              });
              cy.then(() => send({ type: 'mouseMoved', ...origin, button: 'none', buttons: 0 }));
              cy.then(() => send({ type: 'mousePressed', ...origin, button: 'left', buttons: 1, clickCount: 1 }));
              cy.get(nameResizer).should(element => {
                expect(pointerId, 'native pointerdown reached the handle').to.be.a('number');
                expect(element[0].hasPointerCapture(pointerId), 'pointer captured').to.equal(true);
              }).then(() => handle.addEventListener('pointermove', move, { once: true }));
              // Move below the header as well as right; only pointer capture can route this to the handle.
              cy.then(() => send({ type: 'mouseMoved', ...end, button: 'left', buttons: 1 }));
              cy.then(() => send({ type: 'mouseReleased', ...end, button: 'left', buttons: 0, clickCount: 1 }));
              cy.get('@capturedMove').should('have.been.calledOnce').then(spy => {
                expect(spy.firstCall.args[0].isTrusted, 'native captured pointermove').to.equal(true);
                expect(spy.firstCall.args[0].target).to.equal(handle);
              });
              cy.get(nameResizer).should(element => expect(element[0].hasPointerCapture(pointerId), 'capture released').to.equal(false));
            });
            cy.get(table).should('have.class', 'columns-resized').and('have.css', 'table-layout', 'fixed');
            cy.get(table).should(current => expect(current[0].getBoundingClientRect().width).to.be.closeTo(tableWidth + 80, 1));
            expectWidths(before, 80);
            expectApps(appNames);
          });
        });
        cy.setExperience('classic');
        cy.get(`${apps} .column-resizer`).should('not.exist');
        cy.get(table).should('not.have.class', 'resizable-table').and('not.have.class', 'columns-resized')
          .and('have.css', 'table-layout', 'auto');
        cy.get(table).should(current => expect(current[0].style.width).to.equal(''));
        cy.get(`${table} > colgroup`).should('not.exist');
        expectWidths(classicWidths, 0);
        expectApps(appNames);
      });
    });

    it('groups Health State and Status before Search and filters the actual deployed application rows', () => {
      cy.get(`${table} > tbody > tr.hover-row`).should(rows => {
        const values = Object.fromEntries([...rows].map(row => [row.cells[0].textContent.trim(),
          [row.cells[2].textContent.trim(), row.cells[3].textContent.trim()]]));
        expect(values).to.deep.equal({
          [appNames[0]]: ['OK', 'Active'],
          [appNames[1]]: ['Warning', 'Active'],
          [appNames[2]]: ['Warning', 'Upgrading'],
        });
      });
      cy.get(`${apps} .list-toolbar`).should(toolbar => {
        const button = toolbar[0].querySelector('button[aria-label="Filter table"]');
        const search = toolbar[0].querySelector('app-input input');
        expect(button.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING, 'filter precedes Search in DOM').to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(button.getBoundingClientRect().right, 'filter left of Search').to.be.at.most(search.getBoundingClientRect().left);
      });
      cy.get(filterButton).should('be.enabled').find('svg').should('have.attr', 'aria-hidden', 'true');
      cy.get(`${headers} button[aria-label="Filter"]`).should('not.exist');
      cy.get(filterButton).click().should('have.attr', 'aria-expanded', 'true');
      cy.get(menu).should('be.visible').find('.table-filter-group').should('have.length', 2);
      cy.get(`${menu} .table-filter-group legend`).should(legends => {
        expect([...legends].map(legend => legend.textContent.trim())).to.deep.equal(['Health State', 'Status']);
      });
      cy.get(`${menu} ul[aria-label="Health State"] label`).should(labels => {
        expect([...labels].map(label => label.textContent.trim())).to.deep.equal(['Check All', 'OK', 'Warning']);
      });
      cy.get(`${menu} ul[aria-label="Status"] label`).should(labels => {
        expect([...labels].map(label => label.textContent.trim())).to.deep.equal(['Check All', 'Active', 'Upgrading']);
      });
      filterOption('Health State', 'OK').uncheck();
      expectApps(appNames.slice(1));
      cy.get(filterButton).should('have.class', 'link');
      filterOption('Status', 'Upgrading').uncheck();
      expectApps([appNames[1]]);
      filterOption('Health State', 'Check All').check();
      expectApps(appNames.slice(0, 2));
      filterOption('Status', 'Check All').check();
      expectApps(appNames);
      cy.get(filterButton).should('not.have.class', 'link').click().should('have.attr', 'aria-expanded', 'false');
      cy.get(`${apps} .list-toolbar app-input input`).type('Alpha');
      expectApps([appNames[0]]);
      cy.get(`${apps} .list-toolbar app-input input`).clear();
      expectApps(appNames);

      cy.setExperience('classic');
      cy.get(filterButton).should('not.exist');
      cy.get(`${apps} .column-resizer`).should('not.exist');
      cy.get(`${headers} button[aria-label="Filter"]`).should('have.length', 2);
      cy.get(`${headers} button[title="filter by Status options"]`).click();
      cy.get(menu).should('be.visible');
      cy.get(`${menu} .table-filter-group`).should('not.exist');
      cy.get(`${menu} label`).filter((index, label) => label.textContent.trim() === 'Upgrading')
        .should('have.length', 1).find('input').uncheck();
      expectApps(appNames.slice(0, 2));
    });
  });

  it('copies the exact repair Task Id after its text in New and before its text in Classic', () => {
    const taskCell = '[data-cy=completedjobs] app-question-tool-tip > div';
    const copied = [];
    cy.fixture('cluster-page/repair-jobs/simple.json').then(tasks => {
      const task = tasks[2];
      cy.intercept('GET', apiUrl('/$/GetRepairTaskList?*'), [task]).as('tableRepairs');
      visitNew('/#/repairtasks');
      cy.wait('@tableRepairs');
      cy.get('[data-cy=completedjobs] .base-header button').should('have.attr', 'aria-expanded', 'false').click({ scrollBehavior: 'center' });
      cy.get('[data-cy=completedjobs] .column-resizer[aria-label="Resize Task Id column"]')
        .should('have.length', 1).and('have.attr', 'role', 'separator');
      cy.document().then(doc => {
        // Capture CDK's exact payload without writing to the OS clipboard.
        cy.stub(doc, 'execCommand').callsFake(command => {
          expect(command).to.equal('copy');
          copied.push(doc.activeElement.value);
          return true;
        }).as('copyTaskId');
      });
      ['new', 'classic'].forEach(experience => {
        if (experience === 'classic') { cy.setExperience('classic'); }
        cy.get(taskCell).should('have.length', 1).scrollIntoView().should('be.visible').should(cells => {
          const textNodes = [...cells[0].childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === task.TaskId);
          expect(textNodes, 'exact Task Id text node').to.have.length(1);
          const clipboard = cells[0].querySelector('app-clip-board');
          const direction = experience === 'new' ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
          expect(textNodes[0].compareDocumentPosition(clipboard) & direction, `${experience} copy placement`).to.equal(direction);
        });
        cy.get(`${taskCell} app-clip-board button`).should('have.class', experience === 'new' ? 'modern-copy' : 'mif-copy')
          .scrollIntoView().should('be.visible').click();
        cy.get('@copyTaskId').should('have.callCount', experience === 'new' ? 1 : 2).then(() => {
          expect(copied).to.deep.equal(experience === 'new' ? [task.TaskId] : [task.TaskId, task.TaskId]);
        });
      });
      cy.get('[data-cy=completedjobs] .column-resizer').should('not.exist');
    });
  });
});
