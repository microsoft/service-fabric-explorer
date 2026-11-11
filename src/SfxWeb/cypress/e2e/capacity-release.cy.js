/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, refresh, turnOffRefresh } from './util.cy';

const section = '[data-cy=capacityReleaseDetails]';
const levelRoute = apiUrl('/$/GetCapacityReleaseLevel?*');
const estimateRoute = apiUrl('/$/GetCapacityReleaseEstimate?*');

const relativeLuminance = color => {
  const channels = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  expect(channels, `opaque RGB color: ${color}`).not.to.be.null;
  const linear = channels.slice(1).map(value => {
    const channel = Number(value) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const expectCapacityCellColors = (cell, badgeToken) => {
  const computed = cell.ownerDocument.defaultView.getComputedStyle(cell);
  const expected = cell.ownerDocument.createElement('span').style;
  expected.backgroundColor = computed.getPropertyValue(badgeToken).trim();
  expect(expected.backgroundColor, `${badgeToken} must be a defined color`).not.to.equal('');
  expect(computed.backgroundColor, `${badgeToken} background`).to.equal(expected.backgroundColor);

  const [darker, lighter] = [relativeLuminance(computed.color), relativeLuminance(computed.backgroundColor)]
    .sort((a, b) => a - b);
  expect((lighter + 0.05) / (darker + 0.05), 'WCAG AA text contrast').to.be.at.least(4.5);
};

context('Cluster capacity release details', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.intercept('GET', apiUrl('/$/GetLoadInformation?*'), {
      fixture: 'cluster-page/upgrade/get-load-information.json'
    });
    cy.intercept(apiUrl('/$/SetCapacityReleaseLevel*'), {
      statusCode: 500,
      body: { Error: { Code: 'UnexpectedWrite', Message: 'This view must be read-only.' } }
    }).as('setCapacityReleaseLevel');
  });

  afterEach(() => {
    cy.get('@setCapacityReleaseLevel.all').should('have.length', 0);
  });

  it('displays and refreshes the current level and paged estimation matrix without write controls', () => {
    let currentLevel = 'Minor';
    let noneUsage = '120';

    cy.intercept(levelRoute, request => {
      expect(request.method).to.equal('GET');
      expect(request.query['api-version']).to.equal('12.0');
      request.reply({ Level: currentLevel });
    }).as('capacityLevel');
    cy.intercept(estimateRoute, request => {
      expect(request.method).to.equal('GET');
      expect(request.query['api-version']).to.equal('12.0');
      if (request.query.ContinuationToken) {
        expect(request.query.ContinuationToken).to.equal('capacity-page-2');
        request.reply({
          Items: [
            { Level: 'Minor', MetricName: 'CPU', UsedCapacity: '100', TotalCapacity: '100' },
            { Level: 'Major', MetricName: 'CPU', UsedCapacity: '70', TotalCapacity: '100' },
            { Level: 'Minor', MetricName: 'Memory', UsedCapacity: '1024', TotalCapacity: '1024' },
            { Level: 'Major', MetricName: 'Memory', UsedCapacity: '900', TotalCapacity: '1024' }
          ]
        });
      } else {
        request.reply({
          Items: [
            { Level: 'None', MetricName: 'CPU', UsedCapacity: noneUsage, TotalCapacity: '100' },
            { Level: 'None', MetricName: 'Memory', UsedCapacity: '1100', TotalCapacity: '1024' }
          ],
          ContinuationToken: 'capacity-page-2'
        });
      }
    }).as('capacityEstimates');

    cy.visit('/#/details');
    turnOffRefresh();
    cy.wait('@capacityLevel');
    cy.wait('@capacityEstimates');
    cy.wait('@capacityEstimates');

    cy.get(section).scrollIntoView().should('be.visible').within(() => {
      cy.contains('h2', 'Capacity Release');
      cy.get('b').should('have.text', 'Minor');
      cy.get('thead th').then(headers => {
        expect([...headers].map(header => header.textContent.trim()))
          .to.deep.equal(['Metric', 'Total capacity', 'None', 'Minor', 'Major']);
      });
      cy.get('tbody tr').should('have.length', 2);
      cy.contains('tbody tr', 'CPU').within(() => {
        cy.get('td').then(cells => {
          expect([...cells].map(cell => cell.querySelector('.capacity-value')?.textContent.trim() ?? cell.textContent.trim()))
            .to.deep.equal(['CPU', '100', '120', '100', '70']);
        });
        cy.get('td').eq(2).should('have.class', 'over-capacity')
          .and(cells => expectCapacityCellColors(cells[0], '--badge-error'))
          .find('.capacity-status').should('have.text', 'Over capacity').and('be.visible');
        cy.get('td').eq(3).should('have.class', 'within-capacity')
          .and(cells => expectCapacityCellColors(cells[0], '--badge-ok'))
          .find('.capacity-status').should('have.text', 'Within capacity').and('be.visible');
        cy.get('td').eq(4).should('have.class', 'within-capacity');
      });
      cy.contains('tbody tr', 'Memory').find('td').then(cells => {
        expect([...cells].map(cell => cell.querySelector('.capacity-value')?.textContent.trim() ?? cell.textContent.trim()))
          .to.deep.equal(['Memory', '1,024', '1,100', '1,024', '900']);
      });
      cy.get('table').should('have.class', 'detail-table').and('have.class', 'detail-list')
        .and('have.attr', 'aria-labelledby', 'capacityReleaseEstimationTitle');
      cy.get('button:not([aria-expanded]), input, select, .action-modal').should('not.exist');
      cy.get('[role=alert]').should('not.exist');
    });
    cy.get('app-navbar [data-cy=actions]').should('not.exist');

    cy.then(() => {
      currentLevel = 'Major';
      noneUsage = '95';
    });
    refresh();
    cy.wait('@capacityLevel');
    cy.wait('@capacityEstimates');
    cy.wait('@capacityEstimates');

    cy.get(section).within(() => {
      cy.get('b').should('have.text', 'Major');
      cy.contains('tbody tr', 'CPU').find('td').eq(2)
        .should('contain', '95').and('have.class', 'within-capacity');
    });
  });

  [
    {
      name: 'unsupported API responses',
      response: {
        statusCode: 500,
        body: {
          Error: {
            Code: 'FABRIC_E_OPERATION_NOT_SUPPORTED',
            Message: 'Capacity release is not supported.'
          }
        }
      }
    },
    { name: 'empty HTTP 200 responses', response: { statusCode: 200, body: '' } },
    { name: 'bodyless HTTP 501 responses', response: { statusCode: 501, body: '' } }
  ].forEach(({ name, response: unavailable }) => {
    it(`hides ${name} without popups and recovers on refresh`, () => {
      cy.intercept('GET', levelRoute, unavailable).as('capacityLevel');
      cy.intercept('GET', estimateRoute, unavailable).as('capacityEstimates');

      cy.visit('/#/details');
      turnOffRefresh();
      cy.wait(['@capacityLevel', '@capacityEstimates']);

      cy.get(section).should('not.exist');
      cy.get('app-capacity-release').should('exist');
      cy.get('[role=alert]').should('not.exist');

      cy.get('[data-cy=navtabs]').contains('essentials').click();
      cy.get('[data-cy=navtabs]').contains('details').click();
      cy.wait(['@capacityLevel', '@capacityEstimates']);
      cy.get(section).should('not.exist');
      cy.get('[role=alert]').should('not.exist');

      refresh();
      cy.wait(['@capacityLevel', '@capacityEstimates']);
      cy.get(section).should('not.exist');
      cy.get('[role=alert]').should('not.exist');

      cy.intercept('GET', levelRoute, { body: { Level: 'Minor' } }).as('availableLevel');
      refresh();
      cy.wait(['@availableLevel', '@capacityEstimates']);
      cy.get(section).scrollIntoView().should('be.visible').within(() => {
        cy.get('b').should('have.text', 'Minor');
        cy.get('table, h3').should('not.exist');
      });
      cy.get('[role=alert]').should('not.exist');

      cy.intercept('GET', estimateRoute, {
        body: {
          Items: [
            { Level: 'None', MetricName: 'CPU', UsedCapacity: '120', TotalCapacity: '100' },
            { Level: 'Minor', MetricName: 'CPU', UsedCapacity: '100', TotalCapacity: '100' },
            { Level: 'Major', MetricName: 'CPU', UsedCapacity: '70', TotalCapacity: '100' }
          ]
        }
      }).as('availableEstimates');
      refresh();
      cy.wait(['@availableLevel', '@availableEstimates']);
      cy.get(section).within(() => {
        cy.get('b').should('have.text', 'Minor');
        cy.get('tbody tr').should('have.length', 1);
        cy.contains('td', '120').find('.capacity-status').should('have.text', 'Over capacity');
      });
    });
  });
});
