// Custom commands for common operations
// Following GitLab best practices: fabricate via API, avoid redundant UI operations

/**
 * Custom command to create a recipe via API
 * Best Practice: Resources should be fabricated via API rather than UI
 * This saves time and money during test execution
 *
 * @param {Object} recipeData - The recipe data to create
 * @example cy.createRecipeViaAPI({ name: 'Test Recipe', description: 'Test', prep_time: 10, cook_time: 20 })
 */
Cypress.Commands.add('createRecipeViaAPI', (recipeData) => {
  const defaultData = {
    category: 'dinner',
    prep_time: 10,
    cook_time: 20,
    difficulty: 'easy',
    ingredients: [],
  };

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/recipes/`,
    body: { ...defaultData, ...recipeData },
    headers: {
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 201) {
      return response.body;
    }
    throw new Error(`Failed to create recipe: ${response.status}`);
  });
});

/**
 * Custom command to delete a recipe via API
 * Best Practice: Cleanup via API for efficiency
 *
 * @param {number} recipeId - The ID of the recipe to delete
 */
Cypress.Commands.add('deleteRecipeViaAPI', (recipeId) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/recipes/${recipeId}/`,
    failOnStatusCode: false,
  });
});

/**
 * Custom command to get all recipes via API
 * Best Practice: Use API for data verification where possible
 */
Cypress.Commands.add('getRecipesViaAPI', () => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/api/recipes/`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      return response.body;
    }
    return [];
  });
});

/**
 * Custom command to wait for an element with eventually semantics
 * Best Practice: Use explicit waits with clear duration parameters
 *
 * @param {string} selector - The selector to wait for
 * @param {number} timeout - Maximum time to wait in ms
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  return cy.get(selector, { timeout });
});

/**
 * Custom command to safely blur an input field
 * Best Practice: Avoid clicking body to blur (risks unintended interactions)
 * Instead, use the blur() method directly
 */
Cypress.Commands.add('safeBlur', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).blur();
  return cy.wrap(subject);
});

/**
 * Custom command to fill and submit the recipe form
 * This is a common operation that we'll use in multiple tests
 *
 * @param {Object} recipeData - The recipe data
 */
Cypress.Commands.add('fillRecipeForm', (recipeData) => {
  if (recipeData.name) {
    cy.get('input[name="name"]').clear().type(recipeData.name);
  }
  if (recipeData.description) {
    cy.get('textarea[name="description"]').clear().type(recipeData.description);
  }
  if (recipeData.prep_time) {
    cy.get('input[name="prep_time"]').clear().type(recipeData.prep_time.toString());
  }
  if (recipeData.cook_time) {
    cy.get('input[name="cook_time"]').clear().type(recipeData.cook_time.toString());
  }
});

/**
 * Custom command to verify recipe appears in list
 * Best Practice: Create focused, reusable verification commands
 *
 * @param {string} recipeName - The name to verify
 */
Cypress.Commands.add('verifyRecipeInList', (recipeName) => {
  cy.contains(recipeName).should('be.visible');
});
