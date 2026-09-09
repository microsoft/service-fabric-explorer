import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Operation discovery and empty states', () => {
  beforeEach(() => { addDefaultFixtures(); });
  it('finishes infrastructure loading when there are no infrastructure services', () => {
    cy.intercept('GET', apiUrl('/Applications/System/$/GetServices?*'), { Items: [] }).as('systemServices');
    cy.visit('/#/');
    cy.get('[aria-label="SFX experience"]').select('new');
    cy.get('[data-cy=navtabs]').contains('infrastructure').click();
    cy.wait('@systemServices');
    cy.contains('.infrastructure-state', 'No infrastructure services found').should('be.visible');
    cy.get('app-infrastructure-view').should('not.contain', 'Loading infrastructure jobs');
    cy.get('app-infrastructure-docs').should('not.exist');
  });
  it('browses partitions on demand and loads selected operations', () => {
    const id = '745ab433-dc74-4edb-ac37-ad9cc9a0446d';
    cy.intercept('GET', apiUrl('/Applications/?*'), { Items: [{ Id: 'Example', Name: 'fabric:/Example' }] });
    cy.intercept('GET', apiUrl('/Applications/Example/$/GetServices?*'), { Items: [{ Id: 'Example/Worker', Name: 'fabric:/Example/Worker' }] }).as('services');
    cy.intercept('GET', apiUrl('/Applications/Example/$/GetServices/Example%2FWorker/$/GetPartitions?*'), { Items: [{ PartitionInformation: { Id: id } }] }).as('partitions');
    cy.intercept('GET', '**/EventsStore/Partitions/**', []).as('operations');
    cy.visit('/#/');
    cy.get('[data-cy=navtabs]').contains('orchestration').click();
    cy.get('[aria-label="Partition service"]').should('be.disabled').and('contain', 'Select an application first').and('have.css', 'background-color', 'rgb(33, 38, 45)');
    cy.get('[aria-label="Choose partition"]').should('be.disabled').and('contain', 'Select a service first');
    cy.get('[aria-label="Partition application"]').select('Example');
    cy.wait('@services');
    cy.get('[aria-label="Partition service"]').should('not.be.disabled');
    cy.get('[aria-label="Choose partition"]').should('be.disabled');
    cy.get('[aria-label="Partition service"]').select('Example/Worker');
    cy.wait('@partitions');
    cy.get('[aria-label="Choose partition"]').should('not.be.disabled');
    cy.get('[aria-label="Choose partition"]').select(id);
    cy.get('app-partition-picker .choices select').should(selects => {
      const rects = [...selects].map(select => select.getBoundingClientRect());
      expect(rects).to.have.length(3);
      rects.forEach(rect => expect(rect.width).to.be.at.most(520));
      expect(rects[1].top).to.be.greaterThan(rects[0].bottom);
      expect(rects[2].top).to.be.greaterThan(rects[1].bottom);
      expect(rects[1].left).to.equal(rects[0].left);
      expect(rects[2].left).to.equal(rects[0].left);
    });
    cy.contains('app-partition-picker button', 'Load operations').click();
    cy.wait('@operations');
    cy.get('app-orchestration-view app-event-navigator').should('be.visible');
  });
  it('supports direct IDs and validates invalid input', () => {
    cy.visit('/#/');
    cy.get('[data-cy=navtabs]').contains('orchestration').click();
    cy.contains('button', 'Enter partition ID').click();
    cy.get('[data-cy=partition-input]').type('invalid');
    cy.get('[data-cy=confirm-button]').click();
    cy.get('.operation-error').should('contain', 'valid partition ID');
  });
});
