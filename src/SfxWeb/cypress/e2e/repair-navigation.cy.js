import { addDefaultFixtures, apiUrl } from './util.cy';

describe('Repair navigator destination', () => {
  beforeEach(() => {
    addDefaultFixtures();
    cy.fixture('cluster-page/repair-jobs/simple.json').then(tasks => {
      const task = tasks[2];
      cy.wrap(task).as('repair');
      cy.intercept('GET', apiUrl('/$/GetRepairTaskList?*'), [task]).as('repairs');
    });
    cy.intercept('GET', apiUrl('/Nodes/_nt_0/?*'), { fixture: 'node-page/node-info.json' }).as('repairNode');
    cy.visit('/#/repairtasks');
    cy.setExperience('new');
    cy.wait('@repairs');
    cy.get('app-event-navigator .mark').should('have.length', 1).and('not.have.class', 'cluster').click({ scrollBehavior: 'center' });
  });

  it('opens the exact selected repair in its completed table', () => {
    cy.get('app-event-navigator .inspector-properties dd').should('have.css', 'white-space', 'pre-wrap');
    cy.get('@repair').then(task => {
      cy.get('app-event-navigator .inspector-properties').should('contain', task.TaskId);
      cy.contains('app-event-navigator button', 'Open in repair table').click({ scrollBehavior: 'center' });
      cy.get('[data-cy=completedjobs] app-detail-list .list-toolbar input').should('have.value', task.TaskId);
      cy.get('[data-cy=completedjobs] app-repair-task-view').should('have.length', 1).and('be.visible');
      cy.contains('.repair-tabs a', 'Full Description').click();
      cy.contains('app-repair-task-view dt', 'Task Id').next('dd').should(value => expect(value.text().trim()).to.equal(task.TaskId));
      cy.contains('app-repair-task-view dt', 'Result Status').next('dd').should(value => expect(value.text().trim()).to.equal('Succeeded'));
    });
  });

  it('renders modern node, health-check and executor details and restores Classic', () => {
    cy.contains('app-event-navigator button', 'Open in repair table').click({ scrollBehavior: 'center' });
    cy.wait('@repairNode');
    cy.get('.repair-node').should('have.length', 1).within(() => {
      cy.contains('a', '_nt_0').should('have.attr', 'href').and('include', '/node/_nt_0');
      cy.get('app-health-badge').should('contain', 'OK');
      cy.contains('dt', 'Upgrade Domain').next('dd').should('have.text', '3');
      cy.contains('dt', 'Fault Domain').next('dd').should('have.text', 'fd:/0');
      cy.contains('dt', 'Deactivation Status').next('dd').should('have.text', 'None');
    });
    cy.get('.repair-tabs .nav-link.active').should('have.text', 'Condensed').and('have.css', 'border-bottom-color', 'rgb(247, 129, 102)');
    cy.get('app-repair-task-view app-phase-diagram').should('not.exist');
    cy.get('[data-cy=health-checks] .repair-property').should('have.length', 2).each(property => {
      cy.wrap(property).find('dd > span').should('have.text', 'No');
    });
    cy.get('@repair').then(task => {
      cy.contains('[data-cy=jobinfo] dt', 'Executor').next('dd').should('have.text', task.Executor);
      cy.contains('[data-cy=jobinfo] dt', 'Job Id').next('dd').should(value => expect(value.text().trim()).to.equal(JSON.parse(task.ExecutorData).JobId));
    });
    [1800, 390].forEach(width => {
      cy.viewport(width, 1000);
      cy.get('.repair-detail, .repair-node, .repair-sections, .repair-info').each(element => {
        expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth + 1);
      });
    });
    cy.setExperience('classic');
    cy.get('.repair-detail').should('not.exist');
    cy.get('app-repair-task-view .nodes-container').should('contain', '_nt_0').and('contain', 'FD : fd:/0');
    cy.get('app-repair-task-view .health-check-container').should('contain', 'Perform Preparing Health Check').and('contain', 'No');
  });

  it('expands and collapses phases and copies exact timestamps and raw task data', () => {
    cy.contains('app-event-navigator button', 'Open in repair table').click({ scrollBehavior: 'center' });
    const copied = [];
    cy.document().then(doc => {
      // CDK uses a temporary textarea and execCommand; capture its payload without touching the OS clipboard.
      cy.stub(doc, 'execCommand').callsFake(command => {
        expect(command).to.equal('copy');
        copied.push(doc.activeElement.value);
        return true;
      }).as('copyCommand');
    });
    cy.get('.repair-history app-collapse-container').should('have.length', 3);
    cy.get('.repair-phase-status').should('have.length', 3).each(status => {
      expect(status).to.have.text('Done');
      expect(status).to.have.css('color', 'rgb(63, 185, 80)');
    });
    cy.get('.repair-history .base-header button').each(button => expect(button).to.have.attr('aria-expanded', 'false'));
    cy.contains('.repair-phase-heading > span', /^Preparing$/).closest('app-collapse-container').as('preparing');
    cy.get('@preparing').find('.base-header button').click().should('have.attr', 'aria-expanded', 'true');
    cy.get('@preparing').find('.repair-steps li').should('have.length', 5).each(step => {
      expect(step).to.have.attr('data-state', 'done');
      expect(step.find('.repair-step-state')).to.have.text('Done');
    });
    cy.get('@repair').then(task => {
      const timestamps = ['CreatedUtcTimestamp', 'ClaimedUtcTimestamp', 'PreparingUtcTimestamp', 'PreparingHealthCheckStartUtcTimestamp', 'PreparingHealthCheckEndUtcTimestamp'].map(key => task.History[key]);
      cy.get('@preparing').find('time').should(times => {
        expect([...times].map(time => time.textContent)).to.deep.equal(timestamps);
        expect([...times].map(time => time.getAttribute('datetime'))).to.deep.equal(timestamps);
      });
      cy.get('@preparing').find('button[aria-label="Copy timestamp"]').first().click()
        .should('have.attr', 'aria-label', 'Copied to clipboard').and('be.focused');
      cy.get('button[aria-label="Copy raw repair job"]').click()
        .should('have.attr', 'aria-label', 'Copied to clipboard').and('be.focused');
      cy.get('@copyCommand').should('have.been.calledTwice').then(() => {
        expect(copied).to.deep.equal([task.History.CreatedUtcTimestamp, JSON.stringify(task, null, '\t')]);
      });
    });
    cy.get('@preparing').find('.base-header button').click().should('have.attr', 'aria-expanded', 'false');
    cy.get('@preparing').find('.repair-steps').should('not.exist');
    cy.get('@preparing').find('.base-header button').scrollIntoView().focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('@preparing').find('.base-header button').should('have.attr', 'aria-expanded', 'true');
    cy.get('@preparing').find('.repair-steps li').should('have.length', 5);
    cy.contains('.repair-tabs a', 'Full Description').click();
    cy.contains('.repair-tabs a', 'Condensed').click();
    cy.get('@preparing').find('.base-header button').should('have.attr', 'aria-expanded', 'true');
    cy.get('@preparing').find('.repair-steps li').should('have.length', 5);
  });
});
