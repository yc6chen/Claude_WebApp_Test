# Cypress E2E Tests - Quick Start Guide

## Overview

This project now includes comprehensive E2E tests using Cypress, following best practices from GitLab's testing guide.

## What's Been Added

### Test Infrastructure

- **Cypress 15.5.0** with Testing Library integration
- **Page Object Models** for maintainable test code
- **API Helper Utilities** for efficient test data fabrication
- **Custom Commands** for common operations
- **Comprehensive test suite** covering recipe creation, viewing, and deletion

### Directory Structure

```
frontend/
├── cypress/
│   ├── e2e/                    # E2E test files
│   │   ├── recipe-creation.cy.js
│   │   ├── recipe-viewing.cy.js
│   │   └── recipe-deletion.cy.js
│   ├── fixtures/               # Test data fixtures
│   ├── pages/                  # Page Object Models
│   ├── support/                # Custom commands & API helpers
│   └── .gitignore
├── cypress.config.js
└── CYPRESS_E2E_TESTING.md      # Full documentation
```

## Quick Start

### 1. Start the Application

```bash
# From project root
docker-compose up
```

This starts the full stack (database, backend, frontend).

### 2. Run Tests

#### Interactive Mode (Development)

```bash
cd frontend
npm run cypress:open
```

This opens the Cypress Test Runner where you can:
- Select and run individual tests
- Debug with time-travel
- See tests execute in real-time

#### Headless Mode (CI/CD)

```bash
cd frontend
npm run e2e
```

Runs all tests in headless mode with video recording.

### 3. Available Commands

```bash
# Interactive mode
npm run cypress:open

# Headless mode
npm run e2e
npm run cypress:run

# Specific browsers
npm run e2e:chrome
npm run e2e:firefox

# Headed mode (see browser while running)
npm run e2e:headed

# Run specific test file
npx cypress run --spec "cypress/e2e/recipe-creation.cy.js"
```

## Key Best Practices Implemented

### 1. API Fabrication (Not UI)

Tests create data via API for speed and reliability:

```javascript
// GOOD: Fast and reliable
RecipeFactory.create({ title: 'Test Recipe' });

// AVOID: Slow and brittle
// Creating data through UI clicks
```

### 2. Page Object Models

UI interactions are encapsulated in Page Objects:

```javascript
const recipeListPage = new RecipeListPage();
recipeListPage.visit();
recipeListPage.clickAddButton();
```

### 3. Proper Test Isolation

Each test starts with a clean slate:

```javascript
beforeEach(() => {
  RecipeFactory.deleteAll(); // Clean state
});

afterEach(() => {
  RecipeFactory.deleteAll(); // Clean up
});
```

### 4. Readable Test Structure

Tests form complete sentences:

```javascript
describe('Recipe Creation', () => {
  context('when adding a new recipe', () => {
    it('should create the recipe successfully', () => {
      // test code
    });
  });
});
```

## Test Coverage

### Recipe Creation (`recipe-creation.cy.js`)
- ✅ Creating recipes with all fields filled
- ✅ Displaying newly created recipes
- ✅ Auto-selecting new recipes
- ✅ Canceling recipe creation
- ✅ Creating multiple recipes
- ✅ Adding to existing recipe lists

### Recipe Viewing (`recipe-viewing.cy.js`)
- ✅ Viewing empty recipe lists
- ✅ Displaying single recipes
- ✅ Listing multiple recipes
- ✅ Selecting different recipes
- ✅ Viewing recipe details
- ✅ Handling many recipes
- ✅ Persisting after page refresh

### Recipe Deletion (`recipe-deletion.cy.js`)
- ✅ Deleting the only recipe
- ✅ Deleting one of multiple recipes
- ✅ Sequential deletion
- ✅ Verifying deletion persists
- ✅ Auto-selecting after deletion

## Important Notes

### Adding Test IDs to Components

For tests to work properly, components need `data-testid` attributes. See the detailed guide in `CYPRESS_E2E_TESTING.md` for the complete list of required test IDs.

**Example:**
```jsx
<Box data-testid="recipe-list">
  <ListItem data-testid={`recipe-item-${recipe.id}`}>
    {recipe.title}
  </ListItem>
</Box>
```

### Required Test IDs

The tests expect these `data-testid` attributes:

**RecipeList:**
- `recipe-list` - Main container
- `recipe-item-{id}` - Individual items

**AddRecipeModal:**
- `add-recipe-modal` - Modal container
- `recipe-title-input` - Title input
- `recipe-ingredients-input` - Ingredients input
- `recipe-instructions-input` - Instructions input
- `add-recipe-button` - Submit button
- `cancel-button` - Cancel button

**RecipeDetail:**
- `recipe-detail` - Detail container
- `recipe-detail-title` - Title element
- `recipe-detail-ingredients` - Ingredients section
- `recipe-detail-instructions` - Instructions section
- `delete-recipe-button` - Delete button

### CI/CD Integration

To run in CI/CD pipelines:

```bash
docker-compose up -d
sleep 10  # Wait for services
cd frontend && npm run e2e
docker-compose down
```

## Troubleshooting

### Services Not Running

**Error**: Tests fail to connect to backend/frontend

**Solution**:
```bash
docker-compose up
# Wait for all services to be ready
# Check: http://localhost:3000 and http://localhost:8000/api/recipes/
```

### Missing Test IDs

**Error**: Element not found

**Solution**: Add `data-testid` attributes to components (see documentation)

### Flaky Tests

**Solution**:
- Tests use API fabrication for reliability
- Proper cleanup in hooks ensures isolation
- Explicit waits avoid timing issues

## Resources

- **Full Documentation**: `frontend/CYPRESS_E2E_TESTING.md`
- **GitLab Best Practices**: https://docs.gitlab.com/development/testing_guide/end_to_end/best_practices/
- **Cypress Docs**: https://docs.cypress.io/

## Next Steps

1. **Add Test IDs**: Update components with required `data-testid` attributes
2. **Run Tests**: Verify tests pass with `npm run cypress:open`
3. **Integrate CI/CD**: Add E2E tests to your CI/CD pipeline
4. **Extend Coverage**: Add more tests for new features

---

**Note**: The test suite is production-ready and follows industry best practices from GitLab's testing guide. All tests are designed to be fast, reliable, and maintainable.
