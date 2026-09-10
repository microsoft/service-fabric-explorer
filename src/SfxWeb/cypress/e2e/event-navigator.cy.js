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
    cy.get(`${navigator} .inspector-properties dt, ${navigator} .inspector-properties dd`).each(element => {
      expect(element).to.have.css('font-size', '15px');
      expect(element).to.have.css('font-weight', '400');
    });
    cy.get(`${navigator} .inspector-properties`).should(properties => {
      expect(properties).to.have.css('resize', 'none');
      expect(properties).to.have.css('max-height', 'none');
      expect(properties).to.have.css('scrollbar-width', 'none');
      expect(properties[0].scrollWidth).to.be.at.most(properties[0].clientWidth + 1);
      expect(properties[0].scrollHeight).to.be.at.most(properties[0].clientHeight + 1);
    });
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
    cy.get(`${navigator} .search`).should('have.css', 'border-top-width', '1px');
    cy.get(`${navigator} .search input`).should(input => {
      expect(input).to.have.css('border-top-width', '0px');
      expect(input).to.have.css('box-shadow', 'none');
    }).focus();
    cy.get(`${navigator} .search`).should('have.css', 'outline-width', '2px');
    cy.get(`${navigator} .search input`).should('have.css', 'outline-style', 'none');
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
    cy.get(`${navigator} .inspector, ${navigator} .inspector-properties`).each(element => {
      expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1);
      expect(element[0].scrollHeight).to.be.at.most(element[0].clientHeight + 1);
    });
  });

  it('docks the inspector only when the navigator itself is wide enough', () => {
    cy.viewport(2400, 1200);
    cy.get(`${navigator} .mark`).first().click();
    cy.get(`${navigator} .navigator-main`).then(main => {
      cy.get(`${navigator} .inspector`).should(inspector => {
        expect(inspector[0].getBoundingClientRect().left - main[0].getBoundingClientRect().right).to.be.at.least(16);
        expect(inspector[0].parentElement).to.equal(main[0].parentElement);
        expect(inspector[0].closest('.navigator')).to.equal(null);
        expect(inspector[0].getBoundingClientRect().top).to.equal(main[0].getBoundingClientRect().top);
        expect(inspector[0].getBoundingClientRect().height).to.be.closeTo(main[0].getBoundingClientRect().height, 1);
        expect(inspector[0].scrollWidth).to.be.at.most(inspector[0].clientWidth + 1);
        expect(inspector[0].scrollHeight).to.be.at.most(inspector[0].clientHeight + 1);
      });
    });
    cy.viewport(1000, 1000);
    cy.get(`${navigator} .navigator-main`).then(main => {
      cy.get(`${navigator} .inspector`).should(inspector => {
        expect(inspector[0].getBoundingClientRect().top - main[0].getBoundingClientRect().bottom).to.be.at.least(16);
        expect(inspector[0].getBoundingClientRect().height).to.be.closeTo(main[0].getBoundingClientRect().height, 1);
      });
    });
    cy.get(`${navigator} [aria-label="Close event inspector"]`).click({ scrollBehavior: 'center' });
    cy.get(`${navigator} .navigator-layout`).should('not.have.class', 'has-selection');
  });

  it('resizes the cards with pointer and keyboard without changing the time window', () => {
    cy.viewport(2400, 1200);
    cy.get(`${navigator} .mark`).first().click();
    cy.get(`${navigator} .window-caption`).invoke('text').then(caption => {
      cy.get(`${navigator} .inspector`).invoke('outerWidth').then(before => {
        cy.get(`${navigator} .panel-resizer`).should('be.visible').then(handle => {
          const rect = handle[0].getBoundingClientRect();
          const options = { pointerId: 1, button: 0, eventConstructor: 'PointerEvent', clientY: rect.top + 30, clientX: rect.left + 8 };
          cy.wrap(handle).trigger('pointerdown', options);
          cy.wrap(handle).trigger('pointermove', { ...options, clientX: options.clientX - 150 });
          cy.wrap(handle).trigger('pointerup', { ...options, clientX: options.clientX - 150 });
        });
        cy.get(`${navigator} .inspector`).should(inspector => expect(inspector.outerWidth()).to.be.greaterThan(before + 100));
      });
      cy.get(`${navigator} .panel-resizer`).focus().type('{home}').should('have.attr', 'aria-valuenow', '40');
      cy.get(`${navigator} .panel-resizer`).type('{leftarrow}').should('have.attr', 'aria-valuenow', '40');
      cy.get(`${navigator} .panel-resizer`).type('{end}{rightarrow}').should('have.attr', 'aria-valuenow', '70');
      cy.get(`${navigator} .panel-resizer`).type('{leftarrow}').should('have.attr', 'aria-valuenow', '68');
      cy.get(`${navigator} .navigator-layout`).should(layout => {
        const main = layout[0].querySelector('.navigator-main').getBoundingClientRect();
        const inspector = layout[0].querySelector('.inspector').getBoundingClientRect();
        expect(inspector.height).to.be.closeTo(main.height, 1);
        expect(layout[0].scrollWidth).to.be.at.most(layout[0].clientWidth + 1);
      });
      cy.get(`${navigator} .window-caption`).should('have.text', caption);
    });
    cy.viewport(390, 1000);
    cy.get(`${navigator} .panel-resizer`).should('not.be.visible');
    cy.get(`${navigator} [aria-label="Close event inspector"]`).click({ scrollBehavior: 'center' });
    cy.get(`${navigator} .panel-resizer`).should('not.exist');
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
