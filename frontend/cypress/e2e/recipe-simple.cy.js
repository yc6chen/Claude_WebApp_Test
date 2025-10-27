/**
 * Simplified E2E Test for Recipe Application
 * Testing actual implementation
 */

import { RecipeFactory } from '../support/api-helpers';

describe('Recipe Application', () => {
  beforeEach(() => {
    // Clean state before each test
    RecipeFactory.deleteAll();
    cy.visit('/');
    cy.wait(1000); // Wait for app to load
  });

  afterEach(() => {
    // Clean up after tests
    RecipeFactory.deleteAll();
  });

  context('when creating a recipe', () => {
    it('should open the add recipe modal', () => {
      cy.get('[aria-label="add"]').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Add New Recipe').should('be.visible');
    });

    it('should create a recipe with required fields', () => {
      // Click add button
      cy.get('[aria-label="add"]').click();

      // Wait for modal to open
      cy.get('[role="dialog"]').should('be.visible');

      // Fill out the form - be very specific to avoid ingredient name input
      cy.get('input[name="name"][required]').first().type('Chocolate Chip Cookies');
      cy.get('textarea[name="description"]').type('Delicious homemade cookies');
      cy.get('input[name="prep_time"]').type('15');
      cy.get('input[name="cook_time"]').type('12');

      // Submit the form
      cy.contains('button', 'Add Recipe').click();

      // Verify modal closes and recipe appears
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('Chocolate Chip Cookies', { timeout: 10000 }).should('be.visible');
    });

    it('should cancel recipe creation', () => {
      cy.get('[aria-label="add"]').click();

      // Wait for modal
      cy.get('[role="dialog"]').should('be.visible');

      // Fill the recipe name (first input with name="name")
      cy.get('input[name="name"][required]').first().type('Test Recipe');

      // Cancel
      cy.contains('button', 'Cancel').click();

      // Modal should close
      cy.get('[role="dialog"]').should('not.exist');

      // Recipe should not be created
      cy.contains('Test Recipe').should('not.exist');
    });
  });

  context('when viewing recipes', () => {
    it('should display recipe created via API', () => {
      // Create recipe via API
      RecipeFactory.create({
        name: 'API Created Recipe',
        description: 'Created via API',
        prep_time: 5,
        cook_time: 10
      });

      // Visit the page
      cy.visit('/');
      cy.wait(1000);

      // Verify recipe appears
      cy.contains('API Created Recipe').should('be.visible');
    });

    it('should display multiple recipes', () => {
      // Create multiple recipes via API
      cy.wrap(null).then(() => {
        return Cypress.Promise.all([
          RecipeFactory.create({ name: 'Recipe 1', prep_time: 5, cook_time: 10 }),
          RecipeFactory.create({ name: 'Recipe 2', prep_time: 10, cook_time: 15 }),
          RecipeFactory.create({ name: 'Recipe 3', prep_time: 15, cook_time: 20 })
        ]);
      });

      cy.visit('/');
      cy.wait(1000);

      cy.contains('Recipe 1').should('be.visible');
      cy.contains('Recipe 2').should('be.visible');
      cy.contains('Recipe 3').should('be.visible');
    });

    it('should select and display recipe details', () => {
      RecipeFactory.create({
        name: 'Detailed Recipe',
        description: 'This is a detailed description',
        prep_time: 20,
        cook_time: 30
      });

      cy.visit('/');
      cy.wait(2000);

      // Verify recipe is visible in list first
      cy.contains('Detailed Recipe').should('be.visible');

      // Click on the recipe to select it
      cy.contains('.MuiListItemButton-root', 'Detailed Recipe').click();
      cy.wait(500);

      // Verify the recipe name appears (may already be selected)
      cy.contains('Detailed Recipe').should('be.visible');
      cy.contains('Description').should('be.visible');
      cy.contains('This is a detailed description').should('be.visible');
    });
  });

  context('when deleting recipes', () => {
    it('should delete a recipe', () => {
      RecipeFactory.create({
        name: 'Recipe to Delete',
        prep_time: 5,
        cook_time: 10
      });

      cy.visit('/');
      cy.wait(1000);

      // Verify recipe exists
      cy.contains('Recipe to Delete').should('be.visible');

      // Click to select it (may auto-select if first)
      cy.wait(500);

      // Click delete button
      cy.get('[aria-label="delete"]').click();
      cy.wait(1000);

      // Verify recipe is gone
      cy.contains('Recipe to Delete').should('not.exist');
    });

    it('should delete one of multiple recipes', () => {
      cy.wrap(null).then(() => {
        return Cypress.Promise.all([
          RecipeFactory.create({ name: 'Keep Recipe 1', prep_time: 5, cook_time: 10 }),
          RecipeFactory.create({ name: 'Delete Recipe', prep_time: 10, cook_time: 15 }),
          RecipeFactory.create({ name: 'Keep Recipe 2', prep_time: 15, cook_time: 20 })
        ]);
      });

      cy.visit('/');
      cy.wait(1000);

      // Select recipe to delete
      cy.contains('Delete Recipe').click();
      cy.wait(500);

      // Delete it
      cy.get('[aria-label="delete"]').click();
      cy.wait(1000);

      // Verify it's gone but others remain
      cy.contains('Delete Recipe').should('not.exist');
      cy.contains('Keep Recipe 1').should('be.visible');
      cy.contains('Keep Recipe 2').should('be.visible');
    });
  });

  context('when no recipes exist', () => {
    it('should show empty state', () => {
      cy.visit('/');
      cy.wait(1000);

      // Should show "Select a recipe" message or 0 recipes
      cy.contains(/Select a recipe|0 recipe/).should('be.visible');
    });
  });
});
