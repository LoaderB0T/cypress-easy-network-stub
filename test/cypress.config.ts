import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    video: false,
    defaultCommandTimeout: 4000,
    screenshotOnRunFailure: false,
    reporter: '../node_modules/cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json',
    },
    fixturesFolder: false,
    supportFile: false,
  },
});
