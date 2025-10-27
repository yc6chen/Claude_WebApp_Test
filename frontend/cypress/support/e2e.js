// Import commands.js using ES2015 syntax:
import './commands';
import '@testing-library/cypress/add-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook - ensures clean state before tests
beforeEach(() => {
  // Clear local storage and cookies to ensure tests are isolated
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Global after hook - cleanup after tests
afterEach(() => {
  // Log out if still logged in
  // This prevents tests leaving browsers in logged-in state
  cy.window().then((win) => {
    if (win.localStorage.getItem('authToken')) {
      cy.clearLocalStorage();
    }
  });
});
