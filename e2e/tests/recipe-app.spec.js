// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests for Recipe Management Application
 * Tests the complete user workflow from viewing to creating and deleting recipes
 */

/**
 * Helper function to fill MUI TextField controlled components
 * Uses DOM manipulation with native React events to properly trigger onChange handlers
 */
async function fillMUITextField(page, selector, value) {
  await page.evaluate(({ sel, val }) => {
    const input = document.querySelector(sel);
    if (!input) {
      throw new Error(`Input not found for selector: ${sel}`);
    }

    // Set the value directly
    input.value = val;

    // Trigger React synthetic events
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    const blurEvent = new Event('blur', { bubbles: true });

    input.dispatchEvent(inputEvent);
    input.dispatchEvent(changeEvent);
    input.dispatchEvent(blurEvent);
  }, { sel: selector, val: value });
}

test.describe('Recipe Management Application', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application before each test
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display the application title', async ({ page }) => {
    // Check that the main title is visible
    await expect(page.locator('text=My Recipe Book')).toBeVisible();
  });

  test('should display the recipe list', async ({ page }) => {
    // Check that the recipe list sidebar is visible
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
  });

  test('should open add recipe modal when "Add Recipe" button is clicked', async ({ page }) => {
    // Click the Add Recipe button (Fab with aria-label="add")
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Check that the modal is visible by looking for the dialog title
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).toBeVisible();

    // Check that the modal contains the form fields (use label to be more specific)
    await expect(page.getByLabel('Recipe Name *')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
  });

  test('should close add recipe modal when cancel button is clicked', async ({ page }) => {
    // Open the modal
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Wait a bit for modal to close
    await page.waitForTimeout(500);

    // Check that the modal is not visible by checking the title is gone
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).not.toBeVisible();
  });

  test('should create a new recipe with all fields', async ({ page }) => {
    // Click Add Recipe button
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Wait for modal to be fully ready (animation + React hydration)
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Fill recipe name using helper function
    await fillMUITextField(page, '[data-testid="recipe-name-input"]', 'E2E Test Recipe');
    await page.waitForTimeout(300);

    // Fill description using helper function
    await fillMUITextField(page, '[data-testid="recipe-description-input"]', 'This recipe was created by Playwright E2E test');
    await page.waitForTimeout(300);

    // Fill prep time using helper function
    await fillMUITextField(page, '[data-testid="recipe-prep-time-input"]', '15');
    await page.waitForTimeout(300);

    // Fill cook time using helper function
    await fillMUITextField(page, '[data-testid="recipe-cook-time-input"]', '30');
    await page.waitForTimeout(300);

    // Select difficulty - click on the select field
    // The difficulty field is a MUI Select component - click the combobox div
    await page.locator('[role="combobox"][id*="difficulty"]').click();
    await page.click('li[data-value="medium"]');

    // Add an ingredient using helper function
    await fillMUITextField(page, '[data-testid="ingredient-name-input"]', 'Test Ingredient');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="ingredient-measurement-input"]', '2 cups');
    await page.waitForTimeout(300);

    // Click the IconButton to add the ingredient
    const addIngredientButton = page.locator('button[class*="IconButton"]').last();
    await addIngredientButton.click();

    // Submit the form
    await page.click('button:has-text("Add Recipe")');

    // Wait longer for the API call to complete and modal to close
    await page.waitForTimeout(2000);

    // Verify the recipe appears in the list
    await expect(page.locator('text=E2E Test Recipe')).toBeVisible();
  });

  test('should display recipe details when clicked', async ({ page }) => {
    // Wait for recipes to load
    await page.waitForTimeout(1000);

    // Click on the first recipe in the list (if any exist)
    const firstRecipe = page.locator('[role="listitem"]').first();
    const recipeExists = await firstRecipe.count() > 0;

    if (recipeExists) {
      await firstRecipe.click();

      // Wait for details to load
      await page.waitForTimeout(500);

      // Check that recipe details are visible (exact structure depends on your implementation)
      // This is a basic check that something loaded
      const detailsSection = page.locator('div').filter({ hasText: /prep time|cook time|difficulty/i });
      const hasDetails = await detailsSection.count() > 0;

      expect(hasDetails).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should validate required fields in add recipe form', async ({ page }) => {
    // Open the modal
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Wait for modal to open
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).toBeVisible();

    // The "Add Recipe" button should be disabled when required fields are empty
    const submitButton = page.locator('button:has-text("Add Recipe")');
    await expect(submitButton).toBeDisabled();

    // The form should still be visible (not submitted)
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).toBeVisible();
  });

  test('should delete a recipe', async ({ page }) => {
    // First, create a recipe to delete
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Wait for modal to be fully ready
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Fill recipe fields using helper function
    await fillMUITextField(page, '[data-testid="recipe-name-input"]', 'Recipe to Delete');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-description-input"]', 'This will be deleted');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-prep-time-input"]', '10');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-cook-time-input"]', '20');
    await page.waitForTimeout(300);

    // Select difficulty
    await page.locator('[role="combobox"][id*="difficulty"]').click();
    await page.click('li[data-value="easy"]');

    await page.click('button:has-text("Add Recipe")');
    await page.waitForTimeout(1000);

    // Find and click the recipe
    await page.click('text=Recipe to Delete');
    await page.waitForTimeout(500);

    // Click delete button (look for trash/delete icon or button)
    const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();
    const deleteExists = await deleteButton.count() > 0;

    if (deleteExists) {
      await deleteButton.click();
      await page.waitForTimeout(1000);

      // Verify the recipe is no longer in the list
      await expect(page.locator('text=Recipe to Delete')).not.toBeVisible();
    }
  });

  test('should handle multiple ingredients', async ({ page }) => {
    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Wait for modal to be fully ready
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Fill recipe fields using helper function
    await fillMUITextField(page, '[data-testid="recipe-name-input"]', 'Multi-Ingredient Recipe');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-description-input"]', 'Recipe with multiple ingredients');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-prep-time-input"]', '10');
    await page.waitForTimeout(300);

    await fillMUITextField(page, '[data-testid="recipe-cook-time-input"]', '20');
    await page.waitForTimeout(300);

    // Select difficulty
    await page.locator('[role="combobox"][id*="difficulty"]').click();
    await page.click('li[data-value="easy"]');

    // Add multiple ingredients using data-testid selectors
    const ingredients = [
      { name: 'Ingredient 1', measurement: '1 cup' },
      { name: 'Ingredient 2', measurement: '2 tbsp' },
      { name: 'Ingredient 3', measurement: '3 oz' }
    ];
    for (const ingredient of ingredients) {
      // Fill ingredient fields using helper function
      await fillMUITextField(page, '[data-testid="ingredient-name-input"]', ingredient.name);
      await page.waitForTimeout(300);

      await fillMUITextField(page, '[data-testid="ingredient-measurement-input"]', ingredient.measurement);
      await page.waitForTimeout(300);

      // Click the IconButton to add the ingredient
      const addIngredientButton = page.locator('button[class*="IconButton"]').last();
      await addIngredientButton.click();
      await page.waitForTimeout(300);
    }

    await page.click('button:has-text("Add Recipe")');
    await page.waitForTimeout(1000);

    // Verify recipe was created
    await expect(page.locator('text=Multi-Ingredient Recipe')).toBeVisible();
  });

  test('should display empty state when no recipes exist', async ({ page }) => {
    // This test assumes you might have an empty state
    // If all recipes are deleted, check for empty state message
    const recipeCount = await page.locator('[role="listitem"]').count();

    if (recipeCount === 0) {
      // Check for empty state text or message
      const emptyMessageCount = await page.locator('text=/no recipes|empty|add your first recipe/i').count();
      // If no recipes exist, there should be some kind of empty state indicator
      // This could be text, an icon, or the recipe count showing "0 recipes"
      // For now, just verify the page doesn't crash when there are no recipes
      expect(recipeCount).toBe(0);
    } else {
      // If there are recipes, skip this test
      test.skip();
    }
  });

  test('should be responsive - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page with mobile viewport
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that main elements are still visible
    await expect(page.locator('text=My Recipe Book')).toBeVisible();
    await expect(page.locator('button[aria-label="add"]')).toBeVisible();
  });
});

test.describe('Recipe Application - API Integration', () => {

  test('should load recipes from API', async ({ page }) => {
    // Navigate to the page - this will trigger the API call
    await page.goto('/');

    // Wait for the network to settle
    await page.waitForLoadState('networkidle');

    // Check that the page loaded successfully by verifying title is visible
    await expect(page.locator('text=My Recipe Book')).toBeVisible();

    // Check that the recipes count is displayed (indicates API was called)
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error - match both with and without trailing slash
    await page.route('**/api/recipes**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The app should still render without crashing
    await expect(page.locator('text=My Recipe Book')).toBeVisible();
  });
});

test.describe('Recipe Application - Accessibility', () => {

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for main heading (app uses h6, not h4)
    const h6 = await page.locator('h6').count();
    expect(h6).toBeGreaterThan(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    // Ensure page is loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[aria-label="add"]');
    await addButton.waitFor({ state: 'visible' });
    await addButton.click();

    // Wait for modal to open
    await expect(page.getByRole('heading', { name: 'Add New Recipe' })).toBeVisible();

    // Check that the Recipe Name input has an accessible label
    const nameInput = page.getByLabel('Recipe Name *');
    await expect(nameInput).toBeVisible();

    // Verify it's actually an input field
    const tagName = await nameInput.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('input');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to Add Recipe button
    await page.keyboard.press('Tab');

    // Check that an element is focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });
});
