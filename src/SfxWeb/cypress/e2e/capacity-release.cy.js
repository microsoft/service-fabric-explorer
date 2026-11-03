/// <reference types="cypress" />

import { addDefaultFixtures, apiUrl, refresh, turnOffRefresh } from './util.cy';

const section = '[data-cy=capacityReleaseDetails]';
const levelRoute = apiUrl('/$/GetCapacityReleaseLevel?*');
const estimateRoute = apiUrl('/$/GetCapacityReleaseEstimate?*');

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
            { Level: 'Minor', MetricName: 'Memory', UsedCapacity: '900', TotalCapacity: '1024' }
          ],
          ContinuationToken: ''
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
          expect([...cells].map(cell => cell.textContent.trim()))
            .to.deep.equal(['CPU', '100', '120', '100', '70']);
        });
        cy.get('td').eq(2).should('have.class', 'over-capacity')
          .and('have.css', 'background-color', 'rgb(255, 153, 153)');
        cy.get('td').eq(3).should('have.class', 'within-capacity')
          .and('have.css', 'background-color', 'rgb(153, 255, 153)');
        cy.get('td').eq(4).should('have.class', 'within-capacity');
      });
      cy.contains('tbody tr', 'Memory').find('td').then(cells => {
        expect([...cells].map(cell => cell.textContent.trim()))
          .to.deep.equal(['Memory', '1,024', '1,100', '900', '']);
      });
      cy.get('app-capacity-release button, input, select, .action-modal').should('not.exist');
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

  it('shows unavailable states when the runtime does not support the capacity-release queries', () => {
    const unavailable = {
      statusCode: 500,
      body: {
        Error: {
          Code: 'FABRIC_E_OPERATION_NOT_SUPPORTED',
          Message: 'Capacity release is not supported.'
        }
      }
    };
    cy.intercept('GET', levelRoute, unavailable).as('capacityLevel');
    cy.intercept('GET', estimateRoute, unavailable).as('capacityEstimates');

    cy.visit('/#/details');
    turnOffRefresh();
    cy.wait(['@capacityLevel', '@capacityEstimates']);

    cy.get(section).scrollIntoView().should('be.visible').within(() => {
      cy.get('b').should('have.text', 'Unavailable');
      cy.get('[role=alert]').should('have.length', 2);
      cy.contains('[role=alert]', 'The current capacity release level is unavailable.');
      cy.contains('[role=alert]', 'Capacity release estimation is currently unavailable.');
      cy.get('table, app-capacity-release button, .action-modal').should('not.exist');
    });
  });
});
