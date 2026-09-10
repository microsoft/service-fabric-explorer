import { addDefaultFixtures, addRoute, apiUrl } from './util.cy';

describe('Application exit timeline', () => {
  beforeEach(() => {
    addDefaultFixtures();
    const app = 'VisualObjectsApplicationType';
    addRoute('app', 'app-page/app-type.json', apiUrl(`/Applications/${app}/?a*`));
    addRoute('services', 'app-page/services.json', apiUrl(`/Applications/${app}/$/GetServices?*`));
    addRoute('health', 'app-page/app-health.json', apiUrl(`/Applications/${app}/$/GetHealth?*`));
    addRoute('upgrade', 'app-page/upgrade-progress.json', apiUrl(`/Applications/${app}/$/GetUpgradeProgress?*`));
    addRoute('types', 'app-page/service-types.json', apiUrl(`/ApplicationTypes/${app}/$/GetServiceTypes?*`));
    cy.fixture('app-page/app-events.json').then(events => {
      cy.intercept('GET', apiUrl(`/EventsStore/Applications/${app}/$/Events?*`), [
        ...events,
        { ...events[0], Kind: 'ApplicationContainerInstanceExited', EventInstanceId: 'container-exit', ContainerName: 'test-container' }
      ]);
    });
    cy.visit(`/#/apptype/${app}/app/${app}`);
    cy.get('[aria-label="SFX experience"]').select('new');
  });
  it('renders the navigator and reasons and restores Classic', () => {
    cy.contains('app-collapse-container h2', 'Recent exit events').should('be.visible');
    cy.get('app-rca-summary [data-cy=ApplicationProcessExited]').should('contain', 'Process exits (1)').click();
    cy.get('app-rca-overview .exit-overview > header').should('not.exist');
    cy.get('.exit-links a').should('have.length', 2);
    cy.get('app-rca-overview').should('have.length', 1);
    cy.get('.tab-pane.active app-rca-overview app-event-navigator .mark').should('have.attr', 'aria-label').and('include', 'Application Process Exited');
    cy.get('.tab-pane.active app-rca-overview app-event-navigator .mark').first().click();
    cy.get('app-rca-overview .inspector').should('contain', 'Reported reason');
    cy.get('app-rca-overview .exit-reasons').should('be.visible');
    cy.get('app-rca-overview .exit-reasons').should('contain', 'best effort');
    cy.get('app-rca-summary [data-cy=ApplicationContainerInstanceExited]').should('contain', 'Container exits (1)').click();
    cy.get('app-rca-overview').should('have.length', 1);
    cy.get('.tab-pane.active app-rca-overview app-event-navigator .mark').first().click();
    cy.get('app-rca-overview .inspector').should('contain', 'Application Container Instance Exited');
    cy.get('app-rca-overview app-event-store-timeline').should('not.exist');
    cy.get('[aria-label="SFX experience"]').select('classic');
    cy.get('app-rca-summary [data-cy=ApplicationProcessExited]').should('contain', 'ApplicationProcessExited (1)').click();
    cy.get('app-rca-overview app-event-store-timeline').should('exist');
    cy.get('app-rca-overview .highcharts-container').should('exist');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('app-rca-overview app-event-navigator').should('exist');
    cy.contains('app-collapse-container h2', 'Recent exit events').closest('app-collapse-container').find('.base-header').first().click();
    cy.get('app-rca-summary').should('not.exist');
    cy.contains('app-collapse-container h2', 'Recent exit events').closest('app-collapse-container').find('.base-header').first().click();
    cy.get('app-rca-summary').should('be.visible');
  });

  it('matches inspector height and regular UI typography at wide and narrow sizes', () => {
    cy.viewport(2400, 1200);
    cy.get('app-rca-summary [data-cy=ApplicationProcessExited]').click();
    cy.get('app-rca-overview').should('have.length', 1);
    cy.get('.tab-pane.active app-rca-overview app-event-navigator .mark').first().click();
    [2400, 1000, 390].forEach(width => {
      cy.viewport(width, 1200);
      cy.get('.tab-pane.active app-rca-overview app-event-navigator').should(navigator => {
        const main = navigator[0].querySelector('.navigator-main');
        const inspector = navigator[0].querySelector('.inspector');
        expect(inspector.getBoundingClientRect().height).to.be.closeTo(main.getBoundingClientRect().height, 1);
        expect(inspector.scrollWidth).to.be.at.most(inspector.clientWidth + 1);
        const properties = inspector.querySelector('.inspector-properties');
        const style = properties.ownerDocument.defaultView.getComputedStyle(properties);
        expect(style.scrollbarWidth).to.equal('none');
        expect(style.resize).to.equal('none');
        const name = properties.querySelector('dt');
        const value = properties.querySelector('dd');
        const computed = value.ownerDocument.defaultView.getComputedStyle(value);
        expect(computed.fontWeight).to.equal('400');
        expect(computed.fontSize).to.equal('15px');
        expect(name.ownerDocument.defaultView.getComputedStyle(name).fontSize).to.equal('15px');
        expect(computed.fontFamily).to.equal(name.ownerDocument.defaultView.getComputedStyle(name).fontFamily);
      });
      cy.get('app-rca-overview .inspector-properties').scrollTo('bottom', { ensureScrollable: false });
      cy.get('app-rca-overview .inspector-properties dd').last().should('be.visible');
      cy.get('.tab-pane.active app-rca-overview app-event-navigator').screenshot(`exit-inspector-${width}`);
    });
  });
});
