import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Independent event navigator', () => {
  const navigator = 'app-event-navigator';
  beforeEach(() => {
    addDefaultFixtures();
    const now = Date.now();
    const events = Array.from({ length: 5 }, (_, i) => ({
      Kind: 'NodeAddedToCluster', EventInstanceId: `node-event-${i}`, NodeName: `test-node-${i}`,
      TimeStamp: new Date(now - 3600000 + i * 10).toISOString(), Category: 'StateTransition', HasCorrelatedEvents: false
    }));
    cy.intercept('GET', apiUrl('/EventsStore/Cluster/Events?*'), []);
    cy.intercept('GET', apiUrl('/EventsStore/Nodes/Events?*'), events).as('nodes');
    cy.visit('/#/');
    cy.get('[data-cy=navtabs]').contains('events').click();
    cy.wait('@nodes');
    cy.get(`${navigator} .mark`).should('have.length', 5);
  });

  it('renders an independent chart with no overlapping markers', () => {
    cy.get(`${navigator}`).closest('app-collapse-container').should('not.have.class', 'essen-pane').and('have.css', 'padding', '0px').and('have.css', 'border-top-width', '0px');
    cy.get(`${navigator} .window-caption, ${navigator} .axis, ${navigator} .chart-footer`).each(element => {
      cy.wrap(element).should('have.css', 'font-size', '15px');
    });
    cy.get('app-event-store-timeline').should('not.exist');
    cy.get(`${navigator} .preview, ${navigator} .scope`).should('not.exist');
    cy.get(`${navigator} .mark`).then(marks => {
      const boxes = [...marks].map(mark => mark.getBoundingClientRect());
      boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => {
        expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).to.equal(true);
      }));
    });
  });

  it('selects a marker and shows readable details only on demand', () => {
    cy.get(`${navigator} .inspector`).should('not.exist');
    cy.get(`${navigator} .mark`).first().click();
    cy.get(`${navigator} .inspector`).should('contain', 'Node Added To Cluster').and('contain', 'test-node-0');
    cy.get(`${navigator} .inspector-properties dd`).first().should('have.css', 'white-space', 'pre').and('have.css', 'width').then(width => expect(parseFloat(width)).to.be.at.least(320));
    cy.get(`${navigator} .inspector-properties`).should('have.css', 'resize', 'vertical');
    cy.get(`${navigator} [aria-label="Close event inspector"]`).click({ scrollBehavior: 'center' });
    cy.get(`${navigator} .inspector`).should('not.exist');
  });

  it('opens and reopens the selected event in the results table', () => {
    cy.get(`${navigator} .mark`).first().click();
    cy.contains(`${navigator} button`, 'Open in event table').click();
    cy.get('app-event-results pre').should('contain', 'node-event-0');
    cy.contains('app-event-results button', 'Clear filters').click();
    cy.get('[aria-label="Search event records"]').type('no-matching-event');
    cy.contains(`${navigator} button`, 'Open in event table').click({ scrollBehavior: 'center' });
    cy.get('app-event-results pre').should('contain', 'node-event-0');
    cy.get('app-event-results .row-toggle').should('be.focused');
  });

  it('filters locally and recovers from no matches', () => {
    cy.get(`${navigator} input`).type('test-node-3');
    cy.get(`${navigator} .mark`).should('have.length', 1);
    cy.get(`${navigator} input`).clear().type('no-such-event');
    cy.contains(`${navigator} .empty`, 'No matching events');
    cy.get(`${navigator} input`).clear();
    cy.get(`${navigator} .mark`).should('have.length', 5);
  });

  it('supports drag zoom and keyboard reset without additional requests', () => {
    cy.contains(`${navigator} button`, 'Entire range').click();
    cy.get('@nodes.all').then(requests => {
      const count = requests.length;
      cy.get(`${navigator} .window-caption`).invoke('text').then(before => {
        cy.get(`${navigator} .plot`).then(plot => {
          const rect = plot[0].getBoundingClientRect();
          const options = { pointerId: 1, button: 0, eventConstructor: 'PointerEvent', clientY: rect.bottom - 3 };
          cy.wrap(plot).trigger('pointerdown', { ...options, clientX: rect.left + rect.width * 0.1 });
          cy.wrap(plot).trigger('pointermove', { ...options, clientX: rect.left + rect.width * 0.5 });
          cy.wrap(plot).trigger('pointerup', { ...options, clientX: rect.left + rect.width * 0.5 });
        });
        cy.get(`${navigator} .window-caption`).should(element => expect(element.text()).not.to.equal(before));
      });
      cy.get(`${navigator} .chart`).focus().type('{home}');
      cy.get(`${navigator} .mark`).should('have.length', 5);
      cy.get('@nodes.all').should('have.length', count);
    });
  });

  it('fits narrow screens and retains usable marker targets', () => {
    cy.viewport(390, 1000);
    cy.get(`${navigator} .navigator`).should(element => expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1));
    cy.get(`${navigator} .mark`).first().should(mark => {
      expect(mark[0].getBoundingClientRect().width).to.be.at.least(24);
      expect(mark[0].getBoundingClientRect().height).to.be.at.least(28);
    }).click();
    cy.get(`${navigator} .inspector`).should('be.visible');
  });

  it('switches between the new navigator and the original timeline', () => {
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get(navigator).should('not.exist');
    cy.get('app-event-store-timeline .vis-timeline').should('be.visible');
    cy.contains('app-event-store-timeline button', 'Show Controls').should('be.visible');
    cy.get('app-time-picker .slider-wrapper').should('exist');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get(`${navigator} .mark`).should('have.length', 5);
    cy.get('app-event-store-timeline').should('not.exist');
  });
});
