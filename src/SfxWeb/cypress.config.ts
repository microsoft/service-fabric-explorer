// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    API_PREFIX: '',
  },
  requestTimeout: 10000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  viewportWidth: 1600,
  viewportHeight: 1000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3000',
  },
})
