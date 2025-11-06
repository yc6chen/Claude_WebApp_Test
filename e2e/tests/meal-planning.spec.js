const { test, expect } = require('@playwright/test');

// Increase default timeout for all tests
test.setTimeout(60000);

test.describe('Meal Planning Feature', () => {
  let testUser = {
    username: `mealplan_user_${Date.now()}`,
    email: `mealplan${Date.now()}@test.com`,
    password: 'testpass123'
  };

  // Setup: Create a test user and some recipes
  test.beforeAll(async ({ request }) => {
    // Register test user
    await request.post('http://backend:8000/api/auth/register/', {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        password2: testUser.password
      }
    });
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://frontend:3000/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://frontend:3000/');
  });

  test('should navigate to meal planner', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Open user menu
    await page.click('button[aria-label="account of current user"]', { timeout: 10000 }).catch(() => {
      // Fallback: try finding any button with AccountCircle icon
      return page.click('svg[data-testid="AccountCircleIcon"]').then(() => {
        return page.click('..');
      });
    });

    // Click Meal Planner menu item
    await page.click('text=Meal Planner', { timeout: 10000 });

    // Verify we're on the meal planner page
    await expect(page.locator('h4:has-text("Meal Planner")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Sunday')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Saturday')).toBeVisible({ timeout: 10000 });
  });

  test('should display weekly calendar with meal slots', async ({ page }) => {
    // Navigate to meal planner
    await page.goto('http://frontend:3000/meal-planner');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await expect(page.locator('h4:has-text("Meal Planner")')).toBeVisible({ timeout: 10000 });

    // Check for days of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const day of daysOfWeek) {
      await expect(page.locator(`text=${day}`)).toBeVisible({ timeout: 5000 });
    }

    // Check for meal types
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    for (const mealType of mealTypes) {
      await expect(page.locator(`text=${mealType}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate between weeks', async ({ page }) => {
    await page.goto('http://frontend:3000/meal-planner');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h4:has-text("Meal Planner")')).toBeVisible({ timeout: 10000 });

    // Get initial week range
    const initialWeek = await page.locator('h6').filter({ hasText: /\w+ \d+-\d+, \d+/ }).textContent();

    // Click next week button
    const buttons = await page.locator('button').all();
    const nextButton = buttons.find(async (btn) => {
      const svg = await btn.locator('svg[data-testid="ChevronRightIcon"]').count();
      return svg > 0;
    });

    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Week range should have changed
      const newWeek = await page.locator('h6').filter({ hasText: /\w+ \d+-\d+, \d+/ }).textContent();
      expect(newWeek).not.toBe(initialWeek);
    }

    // Click "Today" button to go back
    await page.click('button:has-text("Today")', { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test('complete meal planning workflow', async ({ page, request }) => {
    // First, create a recipe to add to meal plan
    const loginResponse = await request.post('http://backend:8000/api/auth/login/', {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    });

    const { access } = await loginResponse.json();

    const recipeResponse = await request.post('http://backend:8000/api/recipes/', {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test Meal Plan Recipe',
        description: 'Recipe for meal planning test',
        category: 'dinner',
        prep_time: 15,
        cook_time: 30,
        difficulty: 'easy',
        ingredients: [
          { name: 'Chicken', measurement: '2 lbs', order: 0 },
          { name: 'Rice', measurement: '1 cup', order: 1 },
          { name: 'Vegetables', measurement: '2 cups', order: 2 }
        ]
      }
    });

    expect(recipeResponse.ok()).toBeTruthy();

    // Navigate to meal planner
    await page.goto('http://frontend:3000/meal-planner');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h4:has-text("Meal Planner")')).toBeVisible({ timeout: 10000 });

    // Click an "Add" button to open recipe selector
    const addButtons = await page.locator('button:has-text("Add")').all();
    if (addButtons.length > 0) {
      await addButtons[0].click();

      // Wait for recipe selector modal
      await expect(page.locator('text=Select a Recipe')).toBeVisible({ timeout: 10000 });

      // Search for our recipe
      await page.fill('input[placeholder="Search recipes..."]', 'Test Meal Plan Recipe');
      await page.waitForTimeout(1000); // Wait for debounced search

      // Select the recipe
      await page.click('text=Test Meal Plan Recipe', { timeout: 10000 });

      // Click "Add to Meal Plan" button
      await page.click('button:has-text("Add to Meal Plan")');

      // Verify recipe was added (look for success message)
      await expect(page.locator('text=Recipe added to meal plan')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should generate shopping list from meal plan', async ({ page, request }) => {
    // Create a recipe and add to meal plan first
    const loginResponse = await request.post('http://backend:8000/api/auth/login/', {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    });

    const { access } = await loginResponse.json();

    // Create recipe
    const recipeResponse = await request.post('http://backend:8000/api/recipes/', {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Shopping List Test Recipe',
        description: 'Recipe for shopping list test',
        category: 'lunch',
        prep_time: 10,
        cook_time: 20,
        difficulty: 'easy',
        ingredients: [
          { name: 'Pasta', measurement: '1 lb', order: 0 },
          { name: 'Tomato Sauce', measurement: '2 cups', order: 1 }
        ]
      }
    });

    const recipe = await recipeResponse.json();

    // Add recipe to today's meal plan
    const today = new Date().toISOString().split('T')[0];
    await request.post('http://backend:8000/api/meal-plans/', {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      data: {
        recipe: recipe.id,
        date: today,
        meal_type: 'lunch'
      }
    });

    // Navigate to meal planner
    await page.goto('http://frontend:3000/meal-planner');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h4:has-text("Meal Planner")')).toBeVisible({ timeout: 10000 });

    // Open menu and click "Generate Shopping List"
    await page.click('button[aria-label="More options"]', { timeout: 10000 }).catch(() => {
      return page.click('svg[data-testid="MoreVertIcon"]').then(() => {
        return page.click('..');
      });
    });

    await page.click('text=Generate Shopping List', { timeout: 10000 });

    // Should redirect to shopping list page
    await expect(page).toHaveURL(/\/shopping-lists\/\d+/, { timeout: 15000 });

    // Verify shopping list contains our ingredients
    await expect(page.locator('text=Pasta')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tomato Sauce')).toBeVisible({ timeout: 10000 });
  });

  test('should check off items on shopping list', async ({ page, request }) => {
    // Create shopping list with items via API
    const loginResponse = await request.post('http://backend:8000/api/auth/login/', {
      data: {
        username: testUser.username,
        password: testUser.password
      }
    });

    const { access } = await loginResponse.json();

    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const shoppingListResponse = await request.post('http://backend:8000/api/shopping-lists/', {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test Shopping List',
        start_date: today,
        end_date: weekEnd,
        is_active: true
      }
    });

    const shoppingList = await shoppingListResponse.json();

    // Add items to shopping list
    await request.post(`http://backend:8000/api/shopping-lists/${shoppingList.id}/add_item/`, {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      data: {
        shopping_list: shoppingList.id,
        ingredient_name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: 'dairy'
      }
    });

    // Navigate to shopping list
    await page.goto(`http://frontend:3000/shopping-lists/${shoppingList.id}`);
    await page.waitForLoadState('networkidle');

    // Wait for shopping list to load
    await expect(page.locator('text=Test Shopping List')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Milk')).toBeVisible({ timeout: 10000 });

    // Find and click checkbox for Milk
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    if (checkboxes.length > 0) {
      await checkboxes[0].check();

      // Verify progress updated (should show 1/1)
      await expect(page.locator('text=1 / 1')).toBeVisible({ timeout: 5000 });
    }
  });
});
