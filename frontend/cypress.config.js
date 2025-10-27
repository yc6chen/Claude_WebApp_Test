const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Video and screenshot settings
    video: true,
    screenshotOnRunFailure: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    // Retry settings for CI/CD
    retries: {
      runMode: 2,
      openMode: 0,
    },
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8000',
    },
  },
});
