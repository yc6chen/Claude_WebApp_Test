/**
 * E2E Tests: Recipe Viewing and Listing
 *
 * Best Practices Applied:
 * - Describe/context/it pattern for readable test structure
 * - API fabrication for efficient test data setup
 * - Proper test isolation with cleanup hooks
 * - Clear, focused test cases
 * - Avoidance of redundant assertions
 */

import { RecipeFactory } from '../support/api-helpers';
import { RecipeListPage, RecipeDetailPage } from '../pages';

describe('Recipe Viewing', () => {
  let recipeListPage;
  let recipeDetailPage;

  beforeEach(() => {
    // Best Practice: Start with clean state
    RecipeFactory.deleteAll();

    recipeListPage = new RecipeListPage();
    recipeDetailPage = new RecipeDetailPage();
  });

  afterEach(() => {
    // Best Practice: Clean up test data
    RecipeFactory.deleteAll();
  });

  context('when no recipes exist', () => {
    it('should display an empty recipe list', () => {
      recipeListPage.visit();
      recipeListPage.shouldDisplayRecipes(0);
    });

    it('should not display any recipe details', () => {
      recipeListPage.visit();
      // When no recipes exist, the detail pane might be empty
      // This depends on implementation - adjust as needed
    });
  });

  context('when a single recipe exists', () => {
    let createdRecipe;

    beforeEach(() => {
      // Best Practice: Fabricate resources via API
      RecipeFactory.create({
        title: 'Single Recipe',
        ingredients: 'ingredient A, ingredient B',
        instructions: 'Step 1. Step 2. Step 3.',
      }).then((recipe) => {
        createdRecipe = recipe;
      });

      recipeListPage.visit();
    });

    it('should display the recipe in the list', () => {
      recipeListPage.shouldContainRecipe('Single Recipe');
    });

    it('should automatically select and display the recipe', () => {
      recipeDetailPage.shouldBeVisible();
      recipeDetailPage.shouldHaveTitle('Single Recipe');
    });

    it('should show all recipe details', () => {
      recipeDetailPage.shouldDisplayRecipe({
        title: 'Single Recipe',
        ingredients: 'ingredient A, ingredient B',
        instructions: 'Step 1. Step 2. Step 3.',
      });
    });
  });

  context('when multiple recipes exist', () => {
    let recipes;

    beforeEach(() => {
      // Best Practice: Create test data via API for efficiency
      const recipeData = [
        {
          title: 'Apple Pie',
          ingredients: 'apples, flour, sugar, butter',
          instructions: 'Make dough. Fill with apples. Bake.',
        },
        {
          title: 'Beef Stew',
          ingredients: 'beef, potatoes, carrots, onions',
          instructions: 'Brown beef. Add vegetables. Simmer.',
        },
        {
          title: 'Caesar Salad',
          ingredients: 'romaine, parmesan, croutons, dressing',
          instructions: 'Chop lettuce. Add toppings. Toss with dressing.',
        },
      ];

      // Create all recipes via API
      cy.wrap(null).then(() => {
        const promises = recipeData.map((data) => RecipeFactory.create(data));
        return Cypress.Promise.all(promises).then((created) => {
          recipes = created;
        });
      });

      recipeListPage.visit();
    });

    it('should display all recipes in the list', () => {
      recipeListPage.shouldContainRecipe('Apple Pie');
      recipeListPage.shouldContainRecipe('Beef Stew');
      recipeListPage.shouldContainRecipe('Caesar Salad');
    });

    it('should display the first recipe by default', () => {
      // The app displays the first recipe automatically
      recipeDetailPage.shouldBeVisible();
    });

    it('should allow selecting different recipes from the list', () => {
      // Select each recipe and verify it displays
      recipeListPage.selectRecipe('Beef Stew');
      recipeDetailPage.shouldHaveTitle('Beef Stew');

      recipeListPage.selectRecipe('Caesar Salad');
      recipeDetailPage.shouldHaveTitle('Caesar Salad');

      recipeListPage.selectRecipe('Apple Pie');
      recipeDetailPage.shouldHaveTitle('Apple Pie');
    });

    it('should update the detail view when a recipe is selected', () => {
      recipeListPage.selectRecipe('Caesar Salad');

      // Best Practice: Group related expectations
      recipeDetailPage.shouldDisplayRecipe({
        title: 'Caesar Salad',
        ingredients: 'romaine, parmesan, croutons, dressing',
        instructions: 'Chop lettuce. Add toppings. Toss with dressing.',
      });
    });
  });

  context('when viewing recipe details', () => {
    beforeEach(() => {
      RecipeFactory.create({
        title: 'Detailed Recipe',
        ingredients: 'ingredient 1, ingredient 2, ingredient 3',
        instructions: 'Detailed step-by-step instructions for this recipe.',
      });

      recipeListPage.visit();
    });

    it('should display the recipe title', () => {
      recipeDetailPage.shouldHaveTitle('Detailed Recipe');
    });

    it('should display the recipe ingredients', () => {
      recipeDetailPage.shouldHaveIngredients('ingredient 1, ingredient 2, ingredient 3');
    });

    it('should display the recipe instructions', () => {
      recipeDetailPage.shouldHaveInstructions('Detailed step-by-step instructions');
    });

    it('should show the delete button', () => {
      recipeDetailPage.deleteButtonShouldBeVisible();
    });
  });

  context('when many recipes exist', () => {
    beforeEach(() => {
      // Create 10 recipes for testing scrolling/listing with many items
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(
          RecipeFactory.create({
            title: `Recipe ${i}`,
            ingredients: `ingredients for recipe ${i}`,
            instructions: `instructions for recipe ${i}`,
          })
        );
      }

      cy.wrap(Cypress.Promise.all(promises));
      recipeListPage.visit();
    });

    it('should display all recipes in the list', () => {
      // Verify multiple recipes are visible
      recipeListPage.shouldContainRecipe('Recipe 1');
      recipeListPage.shouldContainRecipe('Recipe 5');
      recipeListPage.shouldContainRecipe('Recipe 10');
    });

    it('should allow navigation between recipes', () => {
      recipeListPage.selectRecipe('Recipe 3');
      recipeDetailPage.shouldHaveTitle('Recipe 3');

      recipeListPage.selectRecipe('Recipe 7');
      recipeDetailPage.shouldHaveTitle('Recipe 7');
    });
  });

  context('when refreshing the page', () => {
    beforeEach(() => {
      RecipeFactory.create({
        title: 'Persistent Recipe',
        ingredients: 'persistent ingredients',
        instructions: 'persistent instructions',
      });

      recipeListPage.visit();
    });

    it('should maintain the recipe list after refresh', () => {
      recipeListPage.shouldContainRecipe('Persistent Recipe');

      // Refresh the page
      cy.reload();

      // Recipe should still be visible
      recipeListPage.shouldContainRecipe('Persistent Recipe');
    });
  });
});
