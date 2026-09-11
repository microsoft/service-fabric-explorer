import { addDefaultFixtures } from './util.cy';

describe('Minimum text size', () => {
  const checkText = () => cy.document().then(doc => {
    const failures = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      const element = text.parentElement;
      if (!element || !text.textContent.trim() || element.closest('script,style,option,.sr-only,[aria-hidden=true]')) continue;
      const style = doc.defaultView.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none') continue;
      if (parseFloat(style.fontSize) < 14.99) failures.push(`${element.tagName}.${element.className}: ${style.fontSize} ${text.textContent.trim().slice(0, 60)}`);
    }
    doc.querySelectorAll('input,textarea,select').forEach(element => {
      if (element.matches('[type=checkbox],[type=radio],[type=range],[type=hidden]')) return;
      const rect = element.getBoundingClientRect();
      const style = doc.defaultView.getComputedStyle(element);
      if (rect.width && rect.height && style.visibility !== 'hidden' && parseFloat(style.fontSize) < 14.99) {
        failures.push(`${element.tagName} control: ${style.fontSize}`);
      }
    });
    expect(failures, 'visible text smaller than 15px').to.deep.equal([]);
  });
  ['new', 'classic'].forEach(experience => {
    it(`uses at least 15px for ${experience} lists and export dialogs`, () => {
      addDefaultFixtures();
      cy.visit('/#/nodes');
      cy.setExperience(experience);
      cy.get('table.detail-list tbody tr').should('have.length.at.least', 1);
      cy.get('body').should('have.css', 'font-family').and('include', '-apple-system').and('include', 'Segoe UI');
      cy.get('select[aria-label="SFX experience"], button[aria-label="SFX experience"]').should('have.css', 'font-family').and('include', '-apple-system');
      checkText();
      cy.contains('app-detail-list button', 'Export').first().click();
      cy.get('.action-modal').should('be.visible');
      checkText();
      cy.contains('.action-modal button', 'Cancel').click();
      cy.viewport(390, 1000);
      checkText();
    });
  });
});
