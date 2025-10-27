/**
 * API Helper Utilities
 *
 * Best Practice: Resources should be fabricated via API wherever possible
 * This module provides utilities for creating test data through the API
 * rather than through UI interactions, which saves time and reduces test flakiness.
 */

const API_BASE_URL = Cypress.env('apiUrl');

/**
 * Recipe fabrication utilities
 * Following GitLab best practice: prefer API fabrication over UI operations
 */
export class RecipeFactory {
  /**
   * Create a recipe with default or custom data
   * @param {Object} overrides - Custom recipe data to override defaults
   * @returns {Cypress.Chainable} The created recipe
   */
  static create(overrides = {}) {
    const defaultRecipe = {
      name: `Test Recipe ${Date.now()}`,
      description: 'Test recipe description',
      category: 'dinner',
      prep_time: 10,
      cook_time: 20,
      difficulty: 'easy',
      ingredients: [],
    };

    const recipeData = { ...defaultRecipe, ...overrides };

    return cy.request({
      method: 'POST',
      url: `${API_BASE_URL}/api/recipes/`,
      body: recipeData,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      return response.body;
    });
  }

  /**
   * Create multiple recipes
   * @param {number} count - Number of recipes to create
   * @param {Object} baseData - Base data for recipes
   * @returns {Cypress.Chainable} Array of created recipes
   */
  static createMultiple(count, baseData = {}) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.create({
          ...baseData,
          name: `${baseData.name || 'Test Recipe'} ${i + 1}`,
        })
      );
    }
    return cy.wrap(Promise.all(promises));
  }

  /**
   * Delete a recipe
   * @param {number} recipeId - ID of recipe to delete
   */
  static delete(recipeId) {
    return cy.request({
      method: 'DELETE',
      url: `${API_BASE_URL}/api/recipes/${recipeId}/`,
      failOnStatusCode: false,
    });
  }

  /**
   * Update a recipe
   * @param {number} recipeId - ID of recipe to update
   * @param {Object} updates - Data to update
   */
  static update(recipeId, updates) {
    return cy.request({
      method: 'PUT',
      url: `${API_BASE_URL}/api/recipes/${recipeId}/`,
      body: updates,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      return response.body;
    });
  }

  /**
   * Get a recipe by ID
   * @param {number} recipeId - ID of recipe to retrieve
   */
  static get(recipeId) {
    return cy.request({
      method: 'GET',
      url: `${API_BASE_URL}/api/recipes/${recipeId}/`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      return response.body;
    });
  }

  /**
   * Get all recipes
   */
  static getAll() {
    return cy.request({
      method: 'GET',
      url: `${API_BASE_URL}/api/recipes/`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      return response.body;
    });
  }

  /**
   * Delete all recipes (useful for cleanup in beforeEach/afterEach)
   * Best Practice: Clean up test data to ensure test isolation
   */
  static deleteAll() {
    return this.getAll().then((recipes) => {
      recipes.forEach((recipe) => {
        this.delete(recipe.id);
      });
    });
  }
}

/**
 * General API utilities
 */
export class APIHelpers {
  /**
   * Wait for API to be ready
   * Useful in CI/CD environments where services start up
   */
  static waitForAPI(maxAttempts = 10, delayMs = 1000) {
    let attempts = 0;

    const checkAPI = () => {
      return cy.request({
        method: 'GET',
        url: `${API_BASE_URL}/api/recipes/`,
        failOnStatusCode: false,
        timeout: 5000,
      }).then((response) => {
        if (response.status === 200) {
          return true;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('API did not become ready in time');
        }

        cy.wait(delayMs);
        return checkAPI();
      });
    };

    return checkAPI();
  }

  /**
   * Check if API is healthy
   */
  static healthCheck() {
    return cy.request({
      method: 'GET',
      url: `${API_BASE_URL}/api/recipes/`,
      failOnStatusCode: false,
    }).then((response) => {
      return response.status === 200;
    });
  }
}
