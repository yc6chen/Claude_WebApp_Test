# Cypress E2E Testing Guide

This project uses Cypress for end-to-end testing, implementing best practices from GitLab's testing guide.

## Table of Contents

- [Overview](#overview)
- [Best Practices Implemented](#best-practices-implemented)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing New Tests](#writing-new-tests)
- [Page Object Models](#page-object-models)
- [API Helpers](#api-helpers)
- [Troubleshooting](#troubleshooting)

## Overview

The E2E test suite covers the core functionality of the Recipe Book application:

- **Recipe Creation**: Creating new recipes through the UI
- **Recipe Viewing**: Viewing and navigating recipe lists and details
- **Recipe Deletion**: Deleting recipes and handling edge cases

## Best Practices Implemented

This test suite follows GitLab's E2E testing best practices:

### 1. Test Structure and Naming

Tests use a readable structure that forms complete sentences:

```javascript
describe('Recipe Creation', () => {         // DevOps stage/feature area
  context('when adding a new recipe', () => {  // Conditions (when/with)
    it('should create the recipe successfully', () => {  // Expected outcome
      // test code
    });
  });
});
```

### 2. Resource Fabrication via API

**Best Practice**: Resources should be fabricated via API wherever possible, not through UI interactions.

```javascript
// GOOD: Create test data via API
beforeEach(() => {
  RecipeFactory.create({ title: 'Test Recipe' });
});

// AVOID: Creating test data through UI in setup
beforeEach(() => {
  cy.visit('/');
  cy.get('[data-testid="add-button"]').click();
  cy.get('[data-testid="title"]').type('Test Recipe');
  // ... more UI interactions
});
```

**Benefits**:
- Faster test execution
- More reliable tests
- Lower CI/CD costs
- Better test isolation

### 3. Efficient Waiting

Tests use explicit waits with clear duration parameters:

```javascript
// Use built-in Cypress waits
cy.get('[data-testid="recipe-list"]', { timeout: 10000 });

// Avoid arbitrary waits when possible
// Only use cy.wait() with explicit reasons
```

### 4. Proper Test Cleanup

**Best Practice**: Clean up test data to ensure isolation.

```javascript
beforeEach(() => {
  RecipeFactory.deleteAll(); // Clean state before each test
});

afterEach(() => {
  RecipeFactory.deleteAll(); // Clean up after tests
});
```

### 5. Focused Assertions

**Best Practice**: Avoid redundant assertions that duplicate earlier validations.

```javascript
// Group related expectations together
recipeDetailPage.shouldDisplayRecipe({
  title: 'Test Recipe',
  ingredients: 'test ingredients',
  instructions: 'test instructions'
});
```

### 6. No UI Operations in Hooks

**Best Practice**: Avoid UI operations in `before()` or `after()` hooks as they prevent screenshot capture on failure.

```javascript
// GOOD: API operations in hooks
beforeEach(() => {
  RecipeFactory.deleteAll();
});

// AVOID: UI operations in hooks
beforeEach(() => {
  cy.visit('/');
  cy.get('button').click();
});
```

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose (for running the full stack)

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
cd frontend
npm install
```

### Environment Setup

Cypress is configured to use:
- **Frontend URL**: `http://localhost:3000`
- **Backend API URL**: `http://localhost:8000`

These are set in `cypress.config.js`.

## Running Tests

### Start the Application

First, ensure the application is running:

```bash
# From the project root
docker-compose up
```

This starts:
- PostgreSQL database (port 5432)
- Django backend (port 8000)
- React frontend (port 3000)

### Run Tests in Interactive Mode

Open Cypress Test Runner for development:

```bash
cd frontend
npm run cypress:open
```

This opens the Cypress UI where you can:
- Select and run individual tests
- See tests execute in real-time
- Debug failing tests
- Take advantage of time-travel debugging

### Run Tests in Headless Mode

Run all tests in CI/CD mode:

```bash
cd frontend
npm run e2e
```

### Run Tests in Specific Browsers

```bash
# Chrome
npm run e2e:chrome

# Firefox
npm run e2e:firefox

# Headed mode (see the browser)
npm run e2e:headed
```

### Run Specific Test Files

```bash
# Run only recipe creation tests
npx cypress run --spec "cypress/e2e/recipe-creation.cy.js"

# Run only recipe viewing tests
npx cypress run --spec "cypress/e2e/recipe-viewing.cy.js"

# Run only recipe deletion tests
npx cypress run --spec "cypress/e2e/recipe-deletion.cy.js"
```

## Test Structure

### Directory Layout

```
frontend/
├── cypress/
│   ├── e2e/                    # Test files
│   │   ├── recipe-creation.cy.js
│   │   ├── recipe-viewing.cy.js
│   │   └── recipe-deletion.cy.js
│   ├── fixtures/               # Test data
│   │   └── recipes.json
│   ├── pages/                  # Page Object Models
│   │   ├── RecipeListPage.js
│   │   ├── AddRecipeModalPage.js
│   │   ├── RecipeDetailPage.js
│   │   └── index.js
│   ├── support/                # Custom commands and utilities
│   │   ├── api-helpers.js      # API fabrication utilities
│   │   ├── commands.js         # Custom Cypress commands
│   │   └── e2e.js             # Global setup
│   ├── screenshots/            # Auto-captured on failure
│   └── videos/                 # Test execution videos
└── cypress.config.js           # Cypress configuration
```

## Writing New Tests

### 1. Create a New Test File

Create a new file in `cypress/e2e/` with the pattern `*.cy.js`:

```javascript
// cypress/e2e/my-feature.cy.js
import { RecipeFactory } from '../support/api-helpers';
import { RecipeListPage } from '../pages';

describe('My Feature', () => {
  beforeEach(() => {
    RecipeFactory.deleteAll();
  });

  afterEach(() => {
    RecipeFactory.deleteAll();
  });

  context('when condition X', () => {
    it('should do Y', () => {
      // test code
    });
  });
});
```

### 2. Use Page Object Models

Encapsulate page interactions in Page Objects:

```javascript
const recipeListPage = new RecipeListPage();

recipeListPage.visit();
recipeListPage.clickAddButton();
recipeListPage.shouldContainRecipe('My Recipe');
```

### 3. Fabricate Resources via API

Use the API helpers for test setup:

```javascript
// Create a single recipe
RecipeFactory.create({
  title: 'Test Recipe',
  ingredients: 'ingredients',
  instructions: 'instructions'
});

// Create multiple recipes
RecipeFactory.createMultiple(5, { title: 'Base Recipe' });

// Delete all recipes
RecipeFactory.deleteAll();
```

### 4. Follow Naming Conventions

- Test files: `feature-name.cy.js`
- Describe blocks: Feature or component name
- Context blocks: Conditions (start with "when", "with", etc.)
- It blocks: Expected outcomes (start with "should")

## Page Object Models

Page Objects encapsulate page interactions for better maintainability.

### RecipeListPage

```javascript
const recipeListPage = new RecipeListPage();

// Actions
recipeListPage.visit();
recipeListPage.selectRecipe('Recipe Title');
recipeListPage.clickAddButton();

// Assertions
recipeListPage.shouldDisplayRecipes(5);
recipeListPage.shouldContainRecipe('My Recipe');
recipeListPage.shouldBeVisible();
```

### AddRecipeModalPage

```javascript
const addRecipeModalPage = new AddRecipeModalPage();

// Actions
addRecipeModalPage.fillForm({
  title: 'Recipe',
  ingredients: 'ingredients',
  instructions: 'instructions'
});
addRecipeModalPage.submit();
addRecipeModalPage.cancel();

// Assertions
addRecipeModalPage.shouldBeVisible();
addRecipeModalPage.addButtonShouldBeDisabled();
```

### RecipeDetailPage

```javascript
const recipeDetailPage = new RecipeDetailPage();

// Actions
recipeDetailPage.clickDelete();
recipeDetailPage.clickEdit();

// Assertions
recipeDetailPage.shouldDisplayRecipe({ title, ingredients, instructions });
recipeDetailPage.shouldHaveTitle('Recipe Title');
recipeDetailPage.deleteButtonShouldBeVisible();
```

## API Helpers

The `api-helpers.js` file provides utilities for API-based resource fabrication.

### RecipeFactory

```javascript
// Create a recipe
RecipeFactory.create({
  title: 'My Recipe',
  ingredients: 'flour, water',
  instructions: 'Mix and bake'
}).then((recipe) => {
  console.log(recipe.id);
});

// Create multiple recipes
RecipeFactory.createMultiple(10);

// Get a recipe
RecipeFactory.get(recipeId);

// Update a recipe
RecipeFactory.update(recipeId, { title: 'Updated Title' });

// Delete a recipe
RecipeFactory.delete(recipeId);

// Delete all recipes
RecipeFactory.deleteAll();

// Get all recipes
RecipeFactory.getAll();
```

### APIHelpers

```javascript
// Wait for API to be ready (useful in CI/CD)
APIHelpers.waitForAPI();

// Check API health
APIHelpers.healthCheck();
```

## Adding Test IDs to Components

For tests to work properly, components need `data-testid` attributes:

### Example: Adding Test IDs to RecipeList

```jsx
<Box data-testid="recipe-list">
  {recipes.map((recipe) => (
    <ListItem key={recipe.id} data-testid={`recipe-item-${recipe.id}`}>
      {recipe.title}
    </ListItem>
  ))}
</Box>
```

### Recommended Test IDs

#### RecipeList Component
- `data-testid="recipe-list"` - Main list container
- `data-testid="recipe-item-{id}"` - Individual recipe items

#### AddRecipeModal Component
- `data-testid="add-recipe-modal"` - Modal container
- `data-testid="recipe-title-input"` - Title input field
- `data-testid="recipe-ingredients-input"` - Ingredients input
- `data-testid="recipe-instructions-input"` - Instructions input
- `data-testid="add-recipe-button"` - Submit button
- `data-testid="cancel-button"` - Cancel button

#### RecipeDetail Component
- `data-testid="recipe-detail"` - Detail container
- `data-testid="recipe-detail-title"` - Recipe title
- `data-testid="recipe-detail-ingredients"` - Ingredients section
- `data-testid="recipe-detail-instructions"` - Instructions section
- `data-testid="delete-recipe-button"` - Delete button
- `data-testid="edit-recipe-button"` - Edit button (if exists)

## Troubleshooting

### Tests Fail to Connect to Backend

**Issue**: Tests fail with network errors.

**Solution**:
1. Ensure Docker containers are running: `docker-compose up`
2. Check backend is accessible: `curl http://localhost:8000/api/recipes/`
3. Check frontend is accessible: `curl http://localhost:3000`

### Tests Are Flaky

**Issue**: Tests pass sometimes and fail other times.

**Solution**:
1. Use explicit waits instead of arbitrary `cy.wait()`
2. Ensure proper cleanup in `beforeEach` and `afterEach`
3. Use `data-testid` attributes instead of CSS selectors
4. Check for race conditions in API calls

### Selector Not Found

**Issue**: `cy.get('[data-testid="..."]')` fails.

**Solution**:
1. Add the `data-testid` attribute to the component
2. Check that the selector matches exactly
3. Wait for the element to appear with `{ timeout: 10000 }`

### Videos and Screenshots

Test videos and screenshots are saved when tests run in headless mode:

- **Videos**: `cypress/videos/`
- **Screenshots**: `cypress/screenshots/`

These are automatically captured on test failure and can help debug CI/CD issues.

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
# Start application in background
docker-compose up -d

# Wait for services to be ready
sleep 10

# Run tests
cd frontend && npm run e2e

# Stop services
docker-compose down
```

### GitHub Actions Example

```yaml
- name: Start application
  run: docker-compose up -d

- name: Wait for services
  run: sleep 10

- name: Run E2E tests
  run: cd frontend && npm run e2e

- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v2
  with:
    name: cypress-screenshots
    path: frontend/cypress/screenshots

- name: Stop application
  run: docker-compose down
```

## Best Practices Summary

1. ✅ **Fabricate via API**: Create test data through API, not UI
2. ✅ **Clean state**: Use `beforeEach` to ensure clean state
3. ✅ **Page Objects**: Encapsulate UI interactions in Page Objects
4. ✅ **Clear naming**: Tests should form readable sentences
5. ✅ **Explicit waits**: Use timeouts instead of arbitrary waits
6. ✅ **Avoid redundancy**: Don't repeat assertions unnecessarily
7. ✅ **Proper cleanup**: Clean up test data in `afterEach`
8. ✅ **No UI in hooks**: Keep `before`/`after` hooks free of UI operations
9. ✅ **Test isolation**: Each test should be independent
10. ✅ **Use test IDs**: Prefer `data-testid` over CSS selectors

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [GitLab E2E Best Practices](https://docs.gitlab.com/development/testing_guide/end_to_end/best_practices/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library - Cypress](https://testing-library.com/docs/cypress-testing-library/intro/)
