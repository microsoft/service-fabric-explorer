const { defineConfig } = require('cypress');
module.exports = defineConfig({
  video: false,
  defaultCommandTimeout: 30000,
  viewportWidth: 1440,
  viewportHeight: 1000,
  screenshotsFolder: 'preview-artifacts/screenshots',
  e2e: {
    baseUrl: 'http://127.0.0.1:3003',
    supportFile: false,
    specPattern: 'scripts/preview/smoke.cy.js'
  }
});
