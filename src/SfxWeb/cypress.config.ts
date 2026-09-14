import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  expose: {
    coverage: false,
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
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config
    },
    baseUrl: 'http://localhost:3000',
  },
})
