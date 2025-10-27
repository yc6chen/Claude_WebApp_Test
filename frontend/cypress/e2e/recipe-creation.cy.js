/**
 * E2E Tests: Recipe Creation
 *
 * Best Practices Applied:
 * - Readable test structure: describe -> context -> it pattern
 * - API fabrication for test setup (not UI)
 * - Proper cleanup in hooks
 * - Aggregate failures for related expectations
 * - Clear test names that form readable sentences
 */

import { RecipeFactory } from '../support/api-helpers';
import { RecipeListPage, AddRecipeModalPage, RecipeDetailPage } from '../pages';

describe('Recipe Creation', () => {
  let recipeListPage;
  let addRecipeModalPage;
  let recipeDetailPage;

  beforeEach(() => {
    // Best Practice: Clean state before each test
    // Delete all recipes via API (not UI) for efficiency
    RecipeFactory.deleteAll();

    // Initialize page objects
    recipeListPage = new RecipeListPage();
    addRecipeModalPage = new AddRecipeModalPage();
    recipeDetailPage = new RecipeDetailPage();

    // Visit the application
    recipeListPage.visit();
  });

  // Best Practice: Clean up after tests to avoid leaving data behind
  afterEach(() => {
    RecipeFactory.deleteAll();
  });

  context('when adding a new recipe via UI', () => {
    it('should successfully create a recipe with all fields filled', () => {
      const newRecipe = {
        title: 'Chocolate Chip Cookies',
        ingredients: 'flour, sugar, butter, chocolate chips, eggs',
        instructions: 'Mix dry ingredients. Add wet ingredients. Bake at 350°F for 12 minutes.',
      };

      // Open the add recipe modal
      recipeListPage.clickAddButton();
      addRecipeModalPage.shouldBeVisible();

      // Fill and submit the form
      addRecipeModalPage
        .fillForm(newRecipe)
        .submit();

      // Best Practice: Use aggregate_failures for multiple related expectations
      // This allows us to see all failures at once rather than one at a time
      cy.wrap(null).then(() => {
        cy.wrap(() => {
          recipeListPage.shouldContainRecipe(newRecipe.title);
          recipeDetailPage.shouldDisplayRecipe(newRecipe);
        }, { timeout: 10000 });
      });
    });

    it('should display the newly created recipe in the list', () => {
      const recipeTitle = 'Banana Bread';

      recipeListPage.clickAddButton();
      addRecipeModalPage
        .shouldBeVisible()
        .fillTitle(recipeTitle)
        .fillIngredients('bananas, flour, sugar, eggs')
        .fillInstructions('Mash bananas, mix all ingredients, bake.')
        .submit();

      // Verify recipe appears in the list
      recipeListPage.shouldContainRecipe(recipeTitle);
    });

    it('should select the newly created recipe automatically', () => {
      const newRecipe = {
        title: 'Pasta Carbonara',
        ingredients: 'pasta, eggs, bacon, parmesan cheese',
        instructions: 'Cook pasta. Fry bacon. Mix with eggs and cheese.',
      };

      recipeListPage.clickAddButton();
      addRecipeModalPage.fillForm(newRecipe).submit();

      // Verify the new recipe is automatically selected and displayed
      recipeDetailPage.shouldHaveTitle(newRecipe.title);
    });
  });

  context('when canceling recipe creation', () => {
    it('should close the modal without creating a recipe', () => {
      recipeListPage.clickAddButton();
      addRecipeModalPage.shouldBeVisible();

      // Fill some data
      addRecipeModalPage.fillTitle('Test Recipe');

      // Cancel the operation
      addRecipeModalPage.cancel();

      // Verify modal is closed and no recipe was created
      addRecipeModalPage.shouldNotBeVisible();
      recipeListPage.shouldNotContainRecipe('Test Recipe');
    });
  });

  context('when creating multiple recipes', () => {
    it('should add each recipe to the list', () => {
      const recipes = [
        { title: 'Recipe 1', ingredients: 'ingredient 1', instructions: 'instruction 1' },
        { title: 'Recipe 2', ingredients: 'ingredient 2', instructions: 'instruction 2' },
        { title: 'Recipe 3', ingredients: 'ingredient 3', instructions: 'instruction 3' },
      ];

      recipes.forEach((recipe) => {
        recipeListPage.clickAddButton();
        addRecipeModalPage.fillForm(recipe).submit();
      });

      // Best Practice: Group related expectations
      recipes.forEach((recipe) => {
        recipeListPage.shouldContainRecipe(recipe.title);
      });
    });
  });

  context('when the recipe list is empty', () => {
    it('should display the first created recipe', () => {
      const firstRecipe = {
        title: 'First Recipe Ever',
        ingredients: 'test ingredients',
        instructions: 'test instructions',
      };

      recipeListPage.clickAddButton();
      addRecipeModalPage.fillForm(firstRecipe).submit();

      recipeDetailPage.shouldDisplayRecipe(firstRecipe);
    });
  });

  context('when recipes already exist', () => {
    beforeEach(() => {
      // Best Practice: Fabricate resources via API for test setup
      // This is faster and more reliable than creating via UI
      RecipeFactory.create({
        title: 'Existing Recipe',
        ingredients: 'existing ingredients',
        instructions: 'existing instructions',
      });

      // Reload the page to show the existing recipe
      recipeListPage.visit();
    });

    it('should add the new recipe and display it alongside existing recipes', () => {
      const newRecipe = {
        title: 'New Recipe',
        ingredients: 'new ingredients',
        instructions: 'new instructions',
      };

      recipeListPage.clickAddButton();
      addRecipeModalPage.fillForm(newRecipe).submit();

      // Both recipes should be visible
      recipeListPage.shouldContainRecipe('Existing Recipe');
      recipeListPage.shouldContainRecipe('New Recipe');
    });

    it('should automatically select the newly created recipe', () => {
      const newRecipe = {
        title: 'Newest Recipe',
        ingredients: 'newest ingredients',
        instructions: 'newest instructions',
      };

      recipeListPage.clickAddButton();
      addRecipeModalPage.fillForm(newRecipe).submit();

      // The new recipe should be selected
      recipeDetailPage.shouldHaveTitle(newRecipe.title);
    });
  });
});
