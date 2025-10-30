# Playwright E2E Tests

End-to-end tests for the Recipe Management Application using Playwright running in Docker.

## 🎯 Overview

This directory contains Playwright E2E tests that run in a Docker container using the official Playwright image. Tests are designed to run seamlessly in the Docker environment with proper service discovery.

## 🏗️ Architecture

The E2E test setup uses:
- **Playwright**: Modern end-to-end testing framework
- **Official Playwright Docker Image**: `mcr.microsoft.com/playwright:v1.40.0-jammy`
- **Docker Compose Profile**: Tests run via the `e2e` profile
- **Network Mode**: Tests share the network with the frontend service for proper service discovery

## 📋 Prerequisites

Before running E2E tests, ensure:
1. Docker and Docker Compose are installed
2. The application services (db, backend, frontend) are running
3. The frontend is accessible at `http://localhost:3000`
4. The backend API is accessible at `http://localhost:8000`

## 🚀 Quick Start

### Run E2E Tests

```bash
# From the project root directory

# Run tests (simplest way)
./run-e2e-tests.sh

# Run tests with fresh build
./run-e2e-tests.sh --build

# Run tests and show report
./run-e2e-tests.sh --report
```

### Alternative: Using Docker Compose Directly

```bash
# Build the Playwright image
docker-compose --profile e2e build playwright

# Run tests
docker-compose --profile e2e run --rm playwright

# Run specific test file
docker-compose --profile e2e run --rm playwright npx playwright test recipe-app.spec.js

# Run tests in headed mode (with browser UI)
docker-compose --profile e2e run --rm playwright npm run test:headed

# Run specific browser
docker-compose --profile e2e run --rm playwright npm run test:chromium
```

## 📁 Directory Structure

```
e2e/
├── tests/
│   └── recipe-app.spec.js    # Main E2E test suite
├── playwright.config.js       # Playwright configuration
├── package.json               # Node.js dependencies
├── Dockerfile                 # Docker image configuration
├── .dockerignore             # Docker ignore file
├── playwright-report/        # HTML test reports (generated)
└── test-results/             # Test artifacts (generated)
```

## 🧪 Test Suites

### Recipe Management Tests
Located in `tests/recipe-app.spec.js`:

1. **Basic UI Tests**
   - Display application title
   - Display recipe list
   - Open/close add recipe modal

2. **CRUD Operations**
   - Create new recipe with all fields
   - Display recipe details
   - Delete recipe
   - Handle multiple ingredients

3. **Form Validation**
   - Validate required fields
   - Handle empty states

4. **API Integration**
   - Load recipes from API
   - Handle API errors gracefully

5. **Accessibility**
   - Proper heading hierarchy
   - Accessible form labels
   - Keyboard navigation

6. **Responsive Design**
   - Mobile viewport testing

## ⚙️ Configuration

### Playwright Config (`playwright.config.js`)

Key settings:
- **Base URL**: `http://frontend:3000` (Docker service discovery)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Traces**: On first retry

### Docker Configuration

The Playwright service in `docker-compose.yml`:
- Uses profile `e2e` (won't start with regular `docker-compose up`)
- Shares network with frontend service
- Mounts test files and results directories
- Sets `BASE_URL` environment variable for service discovery

## 📊 Test Reports

After running tests, reports are generated in:

- **HTML Report**: `./playwright-report/index.html`
- **JSON Results**: `./test-results.json`
- **Screenshots**: `./test-results/` (on failure)
- **Videos**: `./test-results/` (on failure)

### View HTML Report

```bash
# Open the HTML report
docker-compose --profile e2e run --rm -p 9323:9323 playwright npm run report

# Or open directly in browser
open playwright-report/index.html
```

## 🔧 Writing New Tests

### Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use `test.describe` for grouping** related tests
2. **Wait for network idle** before interacting with elements
3. **Use specific selectors** (role, text, test-ids)
4. **Add timeouts** for dynamic content
5. **Clean up test data** after tests
6. **Use page object pattern** for complex UIs

### Debugging Tests

```bash
# Run in debug mode
./run-e2e-tests.sh --debug

# Run single test file
docker-compose --profile e2e run --rm playwright npx playwright test tests/specific-test.spec.js

# Run with headed browser
./run-e2e-tests.sh --headed

# Generate code for test
docker-compose --profile e2e run --rm playwright npm run codegen
```

## 🐛 Troubleshooting

### Services Not Running

**Problem**: Tests fail because services aren't accessible

**Solution**: Ensure services are running first
```bash
docker-compose up -d
# Wait for services to be ready
sleep 10
./run-e2e-tests.sh
```

### Network Issues

**Problem**: Tests can't connect to `http://frontend:3000`

**Solution**: Check network mode in docker-compose.yml
- Playwright service should use `network_mode: "service:frontend"`
- This allows Playwright to access services via container names

### Port Conflicts

**Problem**: Port already in use

**Solution**: Stop conflicting services or change ports in docker-compose.yml

### Browser Launch Failures

**Problem**: Browser fails to launch in Docker

**Solution**: The official Playwright image includes all browsers
- Ensure using `mcr.microsoft.com/playwright` image
- Check Docker has enough resources (memory/CPU)

### Timeout Errors

**Problem**: Tests timeout waiting for elements

**Solution**:
- Increase timeout in `playwright.config.js`
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check if services are actually running

### Test Results Not Visible

**Problem**: Can't access test reports

**Solution**: Results are mounted as volumes
```bash
# Check if volumes are mounted
docker-compose --profile e2e config

# Reports should be in ./playwright-report/
ls -la playwright-report/
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 15

      - name: Run E2E tests
        run: ./run-e2e-tests.sh --build

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## 📈 Test Metrics

Current test coverage:
- **Total Tests**: 15+
- **Test Suites**: 3 (Main UI, API Integration, Accessibility)
- **Browsers**: 3 (Chromium, Firefox, WebKit)
- **Average Runtime**: ~30-60 seconds

## 🔄 Continuous Improvement

To maintain and improve tests:

1. **Add tests for new features** immediately
2. **Update selectors** if UI changes
3. **Keep Playwright updated** for new features
4. **Monitor test flakiness** and fix unstable tests
5. **Review failed tests** and update as needed
6. **Document test coverage** in this README

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Docker Guide](https://playwright.dev/docs/docker)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 🤝 Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add comments for complex interactions
4. Ensure tests are idempotent
5. Update this README with new test information
6. Update project documentation (see [DOCUMENTATION_MAINTENANCE.md](../DOCUMENTATION_MAINTENANCE.md))

---

**Last Updated**: 2025-10-28
**Maintained By**: Development Team
**Playwright Version**: 1.40.0
