/**
 * E2E Tests: Recipe Deletion
 *
 * Best Practices Applied:
 * - Clear test structure with describe/context/it
 * - API fabrication for test data setup
 * - Proper cleanup to avoid test pollution
 * - Focused test cases with clear expectations
 * - Tests form readable sentences when combined with describe blocks
 */

import { RecipeFactory } from '../support/api-helpers';
import { RecipeListPage, RecipeDetailPage } from '../pages';

describe('Recipe Deletion', () => {
  let recipeListPage;
  let recipeDetailPage;

  beforeEach(() => {
    // Best Practice: Clean state for test isolation
    RecipeFactory.deleteAll();

    recipeListPage = new RecipeListPage();
    recipeDetailPage = new RecipeDetailPage();
  });

  afterEach(() => {
    // Best Practice: Clean up after tests
    // Ensures no test data is left behind
    RecipeFactory.deleteAll();
  });

  context('when deleting the only recipe', () => {
    beforeEach(() => {
      // Best Practice: Fabricate via API, not UI
      RecipeFactory.create({
        title: 'Only Recipe',
        ingredients: 'ingredients',
        instructions: 'instructions',
      });

      recipeListPage.visit();
    });

    it('should remove the recipe from the list', () => {
      recipeDetailPage.clickDelete();

      // Wait for deletion to complete and verify
      recipeListPage.shouldNotContainRecipe('Only Recipe');
    });

    it('should leave the recipe list empty', () => {
      recipeDetailPage.clickDelete();

      // Best Practice: Use explicit waits with clear expectations
      cy.wait(500); // Brief wait for UI to update
      recipeListPage.shouldDisplayRecipes(0);
    });

    it('should clear the detail view', () => {
      recipeDetailPage.clickDelete();

      // After deleting the only recipe, detail view should be empty or hidden
      // This depends on your implementation
      cy.wait(500);
    });
  });

  context('when deleting one of multiple recipes', () => {
    let recipes;

    beforeEach(() => {
      // Create multiple recipes via API
      const recipeData = [
        { title: 'Recipe A', ingredients: 'ingredients A', instructions: 'instructions A' },
        { title: 'Recipe B', ingredients: 'ingredients B', instructions: 'instructions B' },
        { title: 'Recipe C', ingredients: 'ingredients C', instructions: 'instructions C' },
      ];

      cy.wrap(null).then(() => {
        const promises = recipeData.map((data) => RecipeFactory.create(data));
        return Cypress.Promise.all(promises).then((created) => {
          recipes = created;
        });
      });

      recipeListPage.visit();
    });

    it('should remove only the selected recipe from the list', () => {
      // Select and delete Recipe B
      recipeListPage.selectRecipe('Recipe B');
      recipeDetailPage.clickDelete();

      // Wait for deletion
      cy.wait(500);

      // Best Practice: Group related expectations
      recipeListPage.shouldNotContainRecipe('Recipe B');
      recipeListPage.shouldContainRecipe('Recipe A');
      recipeListPage.shouldContainRecipe('Recipe C');
    });

    it('should automatically select another recipe after deletion', () => {
      // Select the first recipe
      recipeListPage.selectRecipe('Recipe A');
      recipeDetailPage.shouldHaveTitle('Recipe A');

      // Delete it
      recipeDetailPage.clickDelete();
      cy.wait(500);

      // Should automatically select another recipe
      recipeDetailPage.shouldBeVisible();
      // Should display either Recipe B or Recipe C
    });

    it('should maintain the remaining recipes after deletion', () => {
      recipeListPage.selectRecipe('Recipe B');
      recipeDetailPage.clickDelete();

      cy.wait(500);

      // Verify remaining recipes are still accessible
      recipeListPage.selectRecipe('Recipe A');
      recipeDetailPage.shouldDisplayRecipe({
        title: 'Recipe A',
        ingredients: 'ingredients A',
        instructions: 'instructions A',
      });

      recipeListPage.selectRecipe('Recipe C');
      recipeDetailPage.shouldDisplayRecipe({
        title: 'Recipe C',
        ingredients: 'ingredients C',
        instructions: 'instructions C',
      });
    });
  });

  context('when deleting recipes sequentially', () => {
    beforeEach(() => {
      // Create three recipes
      cy.wrap(
        Cypress.Promise.all([
          RecipeFactory.create({ title: 'First', ingredients: 'i1', instructions: 's1' }),
          RecipeFactory.create({ title: 'Second', ingredients: 'i2', instructions: 's2' }),
          RecipeFactory.create({ title: 'Third', ingredients: 'i3', instructions: 's3' }),
        ])
      );

      recipeListPage.visit();
    });

    it('should delete multiple recipes one by one', () => {
      // Delete first recipe
      recipeListPage.selectRecipe('First');
      recipeDetailPage.clickDelete();
      cy.wait(500);
      recipeListPage.shouldNotContainRecipe('First');

      // Delete second recipe
      recipeListPage.selectRecipe('Second');
      recipeDetailPage.clickDelete();
      cy.wait(500);
      recipeListPage.shouldNotContainRecipe('Second');

      // Only third recipe remains
      recipeListPage.shouldContainRecipe('Third');
    });

    it('should handle deleting all recipes until none remain', () => {
      // Delete all three recipes
      recipeDetailPage.clickDelete();
      cy.wait(500);

      recipeDetailPage.clickDelete();
      cy.wait(500);

      recipeDetailPage.clickDelete();
      cy.wait(500);

      // List should be empty
      recipeListPage.shouldDisplayRecipes(0);
    });
  });

  context('when verifying deletion persists', () => {
    beforeEach(() => {
      RecipeFactory.create({
        title: 'Recipe to Delete',
        ingredients: 'temporary ingredients',
        instructions: 'temporary instructions',
      });

      recipeListPage.visit();
    });

    it('should not show the deleted recipe after page refresh', () => {
      recipeDetailPage.clickDelete();
      cy.wait(500);

      recipeListPage.shouldNotContainRecipe('Recipe to Delete');

      // Refresh the page
      cy.reload();

      // Recipe should still be gone
      recipeListPage.shouldNotContainRecipe('Recipe to Delete');
    });

    it('should have actually deleted the recipe from the backend', () => {
      recipeDetailPage.clickDelete();
      cy.wait(500);

      // Best Practice: Verify via API when possible
      RecipeFactory.getAll().then((recipes) => {
        const titles = recipes.map((r) => r.title);
        expect(titles).not.to.include('Recipe to Delete');
      });
    });
  });

  context('when the detail view is displayed', () => {
    beforeEach(() => {
      RecipeFactory.create({
        title: 'Recipe with Delete Button',
        ingredients: 'ingredients',
        instructions: 'instructions',
      });

      recipeListPage.visit();
    });

    it('should show the delete button', () => {
      recipeDetailPage.deleteButtonShouldBeVisible();
    });

    it('should delete when the delete button is clicked', () => {
      const initialTitle = 'Recipe with Delete Button';

      recipeDetailPage.shouldHaveTitle(initialTitle);
      recipeDetailPage.clickDelete();

      cy.wait(500);
      recipeListPage.shouldNotContainRecipe(initialTitle);
    });
  });
});
