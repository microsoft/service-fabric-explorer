/// <reference types="cypress" />
import { addDefaultFixtures, addRoute, apiUrl } from './util.cy';

const appName = 'VisualObjectsApplicationType';
const serviceType = 'VisualObjects.WebServiceType';
const dialog = 'app-create-service';
const fields = `${dialog} .modal-body > .dl-horizontal`;
const advanced = `${dialog} app-collapse-container`;

const openDialog = () => {
  // This row action only opens the dialog. Never click its submit button.
  cy.get(`[data-cy=serviceTypes] app-action-row button[id="${serviceType}-create-service-button"]`)
    .scrollIntoView().should('be.visible').click();
  cy.get(`${dialog} .action-modal`).should('be.visible');
  cy.get(`${dialog} .modal-title`).should('have.text', 'Create Service');
  cy.contains(`${fields} dd`, serviceType).should('be.visible');
};

const expandAdvanced = () => {
  cy.get(`${advanced} .base-header button`).should('have.attr', 'aria-expanded', 'false').click();
  cy.get(`${advanced} .base-header button`).should('have.attr', 'aria-expanded', 'true');
  cy.get(`${advanced} [collapse-body] > .dl-horizontal > dt`).first().scrollIntoView().should('be.visible');
};

describe('Create Service New styling (fixtures only)', () => {
  beforeEach(() => {
    // Unmatched API requests must not reach a cluster or the static server.
    // Specific fixture routes below take precedence over this fallback.
    cy.intercept({ url: apiUrl('/**'), resourceType: /^(xhr|fetch)$/ }, { statusCode: 501, body: {} }).as('unmatchedApi');
    addDefaultFixtures();
    addRoute('app', 'app-page/app-type.json', apiUrl(`/Applications/${appName}/?a*`));
    addRoute('appParams', 'app-page/app-type-excluded-params.json', apiUrl(`/Applications/${appName}/?ExcludeApplicationParameters=true*`));
    addRoute('appHealth', 'app-page/app-health.json', apiUrl(`/Applications/${appName}/$/GetHealth?*`));
    addRoute('appServices', 'app-page/services.json', apiUrl(`/Applications/${appName}/$/GetServices?*`));
    addRoute('appUpgrade', 'app-page/upgrade-progress.json', apiUrl(`/Applications/${appName}/$/GetUpgradeProgress?*`));
    addRoute('appEvents', 'app-page/app-events.json', apiUrl(`/EventsStore/Applications/${appName}/$/Events?*`));
    addRoute('appManifest', 'app-page/manifest.json', apiUrl(`/Applications/${appName}/$/GetApplicationManifest?*`));
    addRoute('appTypeManifest', 'app-page/app-manifest.json', apiUrl(`/ApplicationTypes/${appName}/$/GetApplicationManifest?*`));
    addRoute('serviceTypes', 'app-page/service-types.json', apiUrl(`/ApplicationTypes/${appName}/$/GetServiceTypes?ApplicationTypeVersion=16.0.0*`));

    // Block both creation paths even if a later fixture matches them accidentally.
    cy.intercept({
      method: 'POST',
      url: /\/Applications\/[^/]+\/\$\/GetServices\/\$\/Create(?:FromTemplate)?(?:\?|$)/,
      middleware: true,
    }, request => request.reply({ statusCode: 403, body: {} })).as('createServiceMutation');

    cy.visit(`/#/apptype/${appName}/app/${appName}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('sfxNewExperience', 'true');
      },
    });
    cy.wait(['@getapp', '@getserviceTypes']);
    cy.get('body').should('have.class', 'sfx-new');
    openDialog();
  });

  afterEach(() => {
    cy.get('@createServiceMutation.all').should('have.length', 0);
    cy.get('@unmatchedApi.all').should('have.length', 0);
  });

  it('uses a tinted header, grid fields and compact full-width advanced collections', () => {
    cy.get(`${dialog} .modal-header`)
      .should('have.css', 'background-color', 'rgb(28, 33, 40)')
      .and('have.css', 'padding', '12px 16px');
    cy.get(`${dialog} .modal-title`).should('have.css', 'font-size', '18px');
    cy.get(fields).should('have.css', 'display', 'grid').and('have.css', 'gap', '12px 20px');
    cy.get(fields).should(list => {
      const columns = getComputedStyle(list[0]).gridTemplateColumns.split(' ');
      expect(columns).to.have.length(2);
      expect(columns[0]).to.equal('200px');
      const label = list[0].querySelector('input[aria-label="Service Name"]').parentElement.previousElementSibling;
      const labelBounds = label.getBoundingClientRect();
      const valueBounds = label.nextElementSibling.getBoundingClientRect();
      expect(valueBounds.top).to.be.closeTo(labelBounds.top, 1);
      expect(valueBounds.left - labelBounds.right).to.be.closeTo(20, 1);
    });

    expandAdvanced();
    cy.get(`${advanced} [collapse-header]`).should('have.css', 'font-size', '15px');
    cy.get(`${advanced} .base-header`).should('have.css', 'padding', '8px 0px');
    cy.get(`${advanced} .status-icon`).should('have.css', 'font-size', '18px');
    cy.get(`${advanced} [collapse-body] > .dl-horizontal`).should('have.css', 'display', 'grid');
    cy.get(`${dialog} .radio-btns`).each(option => {
      cy.wrap(option).find('input[type=radio]').should('have.css', 'width', '16px');
      cy.wrap(option).find('label').should('have.css', 'white-space', 'nowrap').and(label => {
        expect(label[0].getBoundingClientRect().height).to.be.lessThan(30);
        expect(label[0].scrollWidth).to.be.at.most(label[0].clientWidth + 1);
      });
    });
    cy.get(`${advanced} dd > .table-responsive`).should('have.length', 3).each(table => {
      const value = table[0].parentElement;
      const label = value.previousElementSibling;
      const grid = value.parentElement.getBoundingClientRect();
      [label, value].forEach(element => {
        expect(getComputedStyle(element).gridColumn, label.textContent.trim()).to.equal('1 / -1');
        const bounds = element.getBoundingClientRect();
        expect(bounds.left).to.be.closeTo(grid.left, 1);
        expect(bounds.width).to.be.closeTo(grid.width, 1);
      });
    });

    cy.contains(`${dialog} .modal-footer button`, /^Cancel$/).click();
    cy.get(dialog).should('not.exist');
  });

  it('stacks fields and keeps the expanded modal inside a narrow viewport', () => {
    cy.viewport(390, 667);
    expandAdvanced();
    cy.get(`${dialog} .radio-btns label`).should('have.css', 'white-space', 'nowrap');
    cy.get(`${dialog} .modal-body .dl-horizontal`).each(list => {
      cy.wrap(list).should('have.css', 'display', 'grid');
      cy.wrap(list).should(element => {
        expect(getComputedStyle(element[0]).gridTemplateColumns.split(' ')).to.have.length(1);
      });
    });
    cy.get(`${dialog} .action-modal`).should(modal => {
      const win = modal[0].ownerDocument.defaultView;
      const pane = modal[0].closest('.cdk-overlay-pane');
      [pane, modal[0], modal[0].querySelector('.modal-header'), modal[0].querySelector('.modal-footer')].forEach(element => {
        const bounds = element.getBoundingClientRect();
        expect(bounds.left, `${element.className} left`).to.be.at.least(0);
        expect(bounds.right, `${element.className} right`).to.be.at.most(win.innerWidth);
        expect(bounds.top, `${element.className} top`).to.be.at.least(0);
        expect(bounds.bottom, `${element.className} bottom`).to.be.at.most(win.innerHeight);
      });
      const body = modal[0].querySelector('.modal-body');
      expect(body.scrollWidth, 'no horizontal modal-body overflow').to.be.at.most(body.clientWidth + 1);
      expect(body.scrollHeight, 'advanced content scrolls inside the modal').to.be.greaterThan(body.clientHeight);
      expect(getComputedStyle(body).overflowY).to.equal('auto');
    });
    cy.get(`${advanced} dd > .table-responsive`).each(table => {
      expect(getComputedStyle(table[0]).overflowX).to.equal('auto');
      expect(table[0].scrollWidth, 'collection scrolls locally').to.be.greaterThan(table[0].clientWidth);
    });
    cy.get(`${dialog} .modal-body`).scrollTo('bottom');
    cy.contains(`${dialog} .modal-footer button`, /^Cancel$/).should('be.visible').click();
    cy.get(dialog).should('not.exist');
  });

  it('restores Classic dialog styling after leaving New', () => {
    cy.contains(`${dialog} .modal-footer button`, /^Cancel$/).click();
    cy.get(dialog).should('not.exist');
    cy.setExperience('classic');
    openDialog();
    cy.get(`${dialog} .modal-header`).should('have.css', 'background-color', 'rgb(0, 117, 201)');
    cy.get(`${dialog} .modal-title`).should('have.css', 'font-size', '24px');
    cy.get(fields).should('have.css', 'display', 'block');
    cy.get(`${fields} > dt`).first().should('have.css', 'display', 'inline-block');
    cy.contains(`${dialog} .modal-footer button`, /^Cancel$/).click();
    cy.get(dialog).should('not.exist');
  });
});
