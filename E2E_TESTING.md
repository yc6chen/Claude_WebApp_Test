# End-to-End Testing with Playwright

Comprehensive guide for E2E testing the Recipe Management Application using Playwright in Docker.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **Playwright** for end-to-end testing, running in a Docker container using the official Playwright image. The E2E tests validate complete user workflows from the browser perspective.

### Why Playwright?

- **Cross-browser testing**: Chrome, Firefox, Safari (WebKit)
- **Modern and fast**: Parallel execution, auto-wait
- **Official Docker support**: Easy CI/CD integration
- **Rich debugging tools**: Trace viewer, UI mode, screenshots
- **Network control**: Mock APIs, intercept requests

### Test Coverage

Current E2E test coverage includes:
- ✅ Recipe viewing and listing
- ✅ Recipe creation with validation
- ✅ Recipe deletion
- ✅ Multiple ingredient handling
- ✅ Modal interactions
- ✅ API integration
- ✅ Error handling
- ✅ Accessibility checks
- ✅ Responsive design (mobile viewport)

---

## Prerequisites

### Required
- Docker and Docker Compose installed
- Application services running (db, backend, frontend)
- Frontend accessible at `http://localhost:3000`
- Backend API accessible at `http://localhost:8000`

### Recommended
- Basic understanding of Playwright
- Familiarity with async/await in JavaScript
- Knowledge of CSS selectors

---

## Quick Start

### Run E2E Tests

```bash
# Ensure services are running
docker-compose up -d

# Run E2E tests
./run-e2e-tests.sh

# Run with fresh build
./run-e2e-tests.sh --build

# Run and show HTML report
./run-e2e-tests.sh --report
```

### View Test Results

```bash
# View HTML report
open e2e/playwright-report/index.html

# Or serve it
docker-compose --profile e2e run --rm -p 9323:9323 playwright npm run report
```

---

## Architecture

### Docker Setup

The E2E testing architecture consists of:

```
┌─────────────────────────────────────────┐
│  Playwright Container                    │
│  (mcr.microsoft.com/playwright)         │
│  ┌───────────────────────────────────┐ │
│  │ Chromium, Firefox, WebKit         │ │
│  │ browsers + dependencies           │ │
│  └───────────────────────────────────┘ │
│          │                               │
│          │ HTTP requests                │
│          ▼                               │
│  ┌───────────────────────────────────┐ │
│  │ Tests (*.spec.js)                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 │
                 │ network_mode: service:frontend
                 ▼
┌─────────────────────────────────────────┐
│  Frontend Container                      │
│  React App (port 3000)                  │
│          │                               │
│          │ API calls                     │
│          ▼                               │
│  Backend Container                       │
│  Django API (port 8000)                 │
│          │                               │
│          ▼                               │
│  Database Container                      │
│  PostgreSQL (port 5432)                 │
└─────────────────────────────────────────┘
```

### Service Discovery

The Playwright container uses `network_mode: "service:frontend"` to:
- Share the frontend service's network stack
- Access `http://frontend:3000` directly
- Communicate with all services via Docker network

### Key Files

- **`e2e/Dockerfile`**: Playwright Docker image configuration
- **`e2e/playwright.config.js`**: Test runner configuration
- **`e2e/tests/`**: Test files directory
- **`docker-compose.yml`**: Service definitions (profile: e2e)
- **`run-e2e-tests.sh`**: Convenient test runner script

---

## Writing Tests

### Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should perform action', async ({ page }) => {
    // Arrange: Set up test data
    await page.click('button:has-text("Add Recipe")');

    // Act: Perform the action
    await page.fill('input[name="name"]', 'Test Recipe');
    await page.click('button:has-text("Save")');

    // Assert: Verify the result
    await expect(page.locator('text=Test Recipe')).toBeVisible();
  });
});
```

### Locator Strategies

**Recommended (in order of preference):**

1. **Role-based** (most accessible)
   ```javascript
   await page.click('role=button[name="Add Recipe"]');
   ```

2. **Text-based** (readable)
   ```javascript
   await page.click('text=Add Recipe');
   await page.click('button:has-text("Add Recipe")');
   ```

3. **Test IDs** (stable)
   ```javascript
   await page.click('[data-testid="add-recipe-button"]');
   ```

4. **CSS selectors** (last resort)
   ```javascript
   await page.click('button.add-recipe');
   ```

### Common Patterns

#### Waiting for Elements

```javascript
// Wait for element to be visible
await page.waitForSelector('text=My Recipes');

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific timeout
await page.waitForTimeout(1000);

// Wait for navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('a[href="/recipes"]')
]);
```

#### Filling Forms

```javascript
// Fill text input
await page.fill('input[name="name"]', 'Recipe Name');

// Fill textarea
await page.fill('textarea[name="description"]', 'Long description...');

// Select dropdown
await page.click('div#difficulty');
await page.click('li[data-value="medium"]');

// Upload file
await page.setInputFiles('input[type="file"]', 'path/to/file.jpg');
```

#### Assertions

```javascript
// Element visibility
await expect(page.locator('text=Success')).toBeVisible();
await expect(page.locator('text=Error')).not.toBeVisible();

// Element count
await expect(page.locator('.recipe-item')).toHaveCount(5);

// Text content
await expect(page.locator('h1')).toHaveText('My Recipes');
await expect(page.locator('h1')).toContainText('Recipes');

// Element attributes
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('test');
```

#### API Interception

```javascript
// Mock API response
await page.route('**/api/recipes/', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Test Recipe' }
    ])
  });
});

// Wait for API call
const response = await page.waitForResponse(
  response => response.url().includes('/api/recipes') && response.status() === 200
);

// Verify API call was made
expect(response.status()).toBe(200);
const data = await response.json();
expect(data).toHaveLength(5);
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
./run-e2e-tests.sh

# Run specific test file
docker-compose --profile e2e run --rm playwright npx playwright test recipe-app.spec.js

# Run specific test by name
docker-compose --profile e2e run --rm playwright npx playwright test -g "should create a new recipe"

# Run specific browser
docker-compose --profile e2e run --rm playwright npm run test:chromium
docker-compose --profile e2e run --rm playwright npm run test:firefox
docker-compose --profile e2e run --rm playwright npm run test:webkit
```

### Advanced Options

```bash
# Run in headed mode (show browser)
./run-e2e-tests.sh --headed

# Run in UI mode (interactive)
./run-e2e-tests.sh --ui

# Run in debug mode
./run-e2e-tests.sh --debug

# Run with trace
docker-compose --profile e2e run --rm playwright npx playwright test --trace on

# Run specific project (browser)
docker-compose --profile e2e run --rm playwright npx playwright test --project=chromium
```

### Filtering Tests

```bash
# Run tests matching pattern
docker-compose --profile e2e run --rm playwright npx playwright test -g "recipe"

# Run tests in specific file
docker-compose --profile e2e run --rm playwright npx playwright test tests/recipe-app.spec.js

# Run tests with tag
# Add @smoke to test: test('@smoke should load app', async ({ page }) => { ... })
docker-compose --profile e2e run --rm playwright npx playwright test --grep @smoke
```

---

## Debugging

### Debug Mode

```bash
# Run in debug mode (opens inspector)
./run-e2e-tests.sh --debug

# Or directly
docker-compose --profile e2e run --rm playwright npx playwright test --debug
```

### UI Mode

```bash
# Run in UI mode (interactive test runner)
./run-e2e-tests.sh --ui
```

### Trace Viewer

```bash
# Generate trace
docker-compose --profile e2e run --rm playwright npx playwright test --trace on

# View trace
docker-compose --profile e2e run --rm playwright npx playwright show-trace e2e/test-results/path-to-trace.zip
```

### Screenshots and Videos

By default, Playwright captures:
- **Screenshots**: On test failure
- **Videos**: Retained on failure
- **Traces**: On first retry

Find them in `e2e/test-results/`

### Console Logs

Add logging to tests:

```javascript
test('should do something', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Listen to page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error));

  // Your test code
});
```

### Debugging Tips

1. **Use `page.pause()`** to pause execution
   ```javascript
   await page.pause();
   ```

2. **Take screenshots manually**
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

3. **Print page content**
   ```javascript
   console.log(await page.content());
   ```

4. **Check element count**
   ```javascript
   console.log(await page.locator('.recipe-item').count());
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services to be ready
        run: |
          echo "Waiting for services..."
          sleep 15
          curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:3000
          curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:8000/api/recipes/

      - name: Run E2E tests
        run: ./run-e2e-tests.sh --build

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-videos
          path: e2e/test-results/
          retention-days: 7

      - name: Stop services
        if: always()
        run: docker-compose down
```

### GitLab CI Example

```yaml
e2e-tests:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose up -d
    - sleep 15
    - ./run-e2e-tests.sh --build
  artifacts:
    when: always
    paths:
      - e2e/playwright-report/
      - e2e/test-results/
    expire_in: 1 week
```

---

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```javascript
// ❌ Bad: Tests depend on each other
test('create recipe', async ({ page }) => {
  // Creates recipe with ID 1
});

test('delete recipe', async ({ page }) => {
  // Assumes recipe ID 1 exists
});

// ✅ Good: Each test is self-contained
test('create recipe', async ({ page }) => {
  // Create and verify
});

test('delete recipe', async ({ page }) => {
  // Create, then delete, then verify
});
```

### 2. Use Page Object Model

For complex UIs, use page objects:

```javascript
// pages/RecipeModal.js
class RecipeModal {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.click('button:has-text("Add Recipe")');
  }

  async fillForm({ name, description, prepTime, cookTime }) {
    await this.page.fill('input[name="name"]', name);
    await this.page.fill('textarea[name="description"]', description);
    if (prepTime) await this.page.fill('input[name="prep_time"]', prepTime);
    if (cookTime) await this.page.fill('input[name="cook_time"]', cookTime);
  }

  async submit() {
    await this.page.click('button:has-text("Add Recipe")');
  }
}
```

### 3. Wait Smartly

Use appropriate waiting strategies:

```javascript
// ✅ Auto-waiting (preferred)
await page.click('button');

// ✅ Wait for specific condition
await page.waitForLoadState('networkidle');

// ❌ Fixed timeouts (avoid)
await page.waitForTimeout(5000);
```

### 4. Clean Test Data

Clean up after tests:

```javascript
test.afterEach(async ({ page }) => {
  // Delete test recipes
  const testRecipes = await page.locator('[data-test-recipe="true"]').count();
  for (let i = 0; i < testRecipes; i++) {
    await page.click('[data-test-recipe="true"] button[aria-label="delete"]');
  }
});
```

### 5. Use Descriptive Test Names

```javascript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should display error message when creating recipe with empty name', async ({ page }) => { ... });
```

### 6. Group Related Tests

```javascript
test.describe('Recipe Creation', () => {
  test('should create recipe with all fields', async ({ page }) => { ... });
  test('should create recipe with minimal fields', async ({ page }) => { ... });
  test('should validate required fields', async ({ page }) => { ... });
});
```

---

## Troubleshooting

### Services Not Running

**Problem**: Tests fail because services aren't accessible

**Solution**:
```bash
# Check service status
docker-compose ps

# Start services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Verify services are accessible
curl http://localhost:3000
curl http://localhost:8000/api/recipes/
```

### Network Issues

**Problem**: `ERR_CONNECTION_REFUSED` or `net::ERR_NAME_NOT_RESOLVED`

**Solution**:
- Verify `network_mode: "service:frontend"` in docker-compose.yml
- Check BASE_URL in playwright.config.js is `http://frontend:3000`
- Ensure all services are on the same Docker network

### Browser Launch Failures

**Problem**: Browser fails to launch in Docker

**Solution**:
- Verify using official Playwright image: `mcr.microsoft.com/playwright`
- Check Docker has enough resources (at least 2GB RAM)
- Try running with single browser: `npm run test:chromium`

### Timeout Errors

**Problem**: Tests timeout waiting for elements

**Solution**:
```javascript
// Increase timeout in playwright.config.js
module.exports = defineConfig({
  timeout: 60 * 1000, // 60 seconds

  use: {
    actionTimeout: 15 * 1000, // 15 seconds
    navigationTimeout: 30 * 1000, // 30 seconds
  },
});
```

### Test Flakiness

**Problem**: Tests pass sometimes and fail other times

**Solution**:
1. Add explicit waits:
   ```javascript
   await page.waitForLoadState('networkidle');
   ```

2. Use auto-retry assertions:
   ```javascript
   await expect(page.locator('text=Success')).toBeVisible({ timeout: 10000 });
   ```

3. Ensure test independence
4. Check for race conditions

### Can't View Reports

**Problem**: Can't access HTML reports

**Solution**:
```bash
# Check if report was generated
ls -la e2e/playwright-report/

# Serve report
docker-compose --profile e2e run --rm -p 9323:9323 playwright npm run report

# Or open directly
open e2e/playwright-report/index.html
```

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Docker Guide](https://playwright.dev/docs/docker)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Test Retry Strategies](https://playwright.dev/docs/test-retries)

## Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add comments for complex interactions
4. Ensure tests are idempotent
5. Update this documentation
6. Update [TEST_QUICK_START.md](./TEST_QUICK_START.md) with test counts
7. See [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md) for guidelines

---

**Last Updated**: 2025-10-28
**Maintained By**: Development Team
**Playwright Version**: 1.40.0
