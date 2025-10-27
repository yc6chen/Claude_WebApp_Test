# How to Run Cypress Tests in WSL

## Step 1: Install System Dependencies

Run the installation script with sudo privileges:

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp
sudo bash install-cypress-deps.sh
```

This will install all required graphical libraries for Cypress.

## Step 2: Verify Cypress Installation

After installing dependencies:

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend
npx cypress verify
```

You should see: `✓ Cypress binary verified`

## Step 3: Make Sure Application is Running

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp
docker-compose up -d

# Wait a few seconds for services to start
sleep 10

# Verify services are running
curl http://localhost:8000/api/recipes/
curl http://localhost:3000
```

## Step 4: Run Cypress Tests

### Option A: Run All Tests (Headless)

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend
npx cypress run
```

### Option B: Run Specific Test File

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend

# Run the simplified working test
npx cypress run --spec "cypress/e2e/recipe-simple.cy.js"

# Or run other tests
npx cypress run --spec "cypress/e2e/recipe-creation.cy.js"
npx cypress run --spec "cypress/e2e/recipe-viewing.cy.js"
npx cypress run --spec "cypress/e2e/recipe-deletion.cy.js"
```

### Option C: Run with Xvfb (Virtual Display)

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend
xvfb-run npx cypress run
```

### Option D: Run in Specific Browser

```bash
# Electron (default, most reliable in WSL)
npx cypress run --browser electron

# Chrome (if installed)
npx cypress run --browser chrome

# Firefox (if installed)
npx cypress run --browser firefox
```

### Option E: Interactive Mode (if X server is set up)

```bash
# This requires an X server like VcXsrv or X410 to be running on Windows
export DISPLAY=:0
npx cypress open
```

## Expected Output

When tests run successfully, you'll see:

```
  Running:  recipe-simple.cy.js                                         (1 of 1)


  Recipe Application
    when creating a recipe
      ✓ should open the add recipe modal (450ms)
      ✓ should create a recipe with required fields (1250ms)
      ✓ should cancel recipe creation (650ms)
    when viewing recipes
      ✓ should display recipe created via API (890ms)
      ✓ should display multiple recipes (1100ms)
      ✓ should select and display recipe details (950ms)
    when deleting recipes
      ✓ should delete a recipe (1050ms)
      ✓ should delete one of multiple recipes (1300ms)
    when no recipes exist
      ✓ should show empty state (450ms)


  9 passing (8s)
```

## Troubleshooting

### If Cypress Still Can't Find Libraries

Try installing additional dependencies:

```bash
sudo apt-get install -y \
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libdbus-1-3 \
  libexpat1 \
  libx11-6 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils
```

### If Tests Fail Due to Network Issues

Make sure Docker containers are running:

```bash
docker-compose ps

# Should show frontend, backend, and db as "Up"
```

Check if services are accessible:

```bash
curl http://localhost:8000/api/recipes/  # Backend
curl http://localhost:3000                # Frontend
```

### If Tests Are Flaky

Add more wait time in tests or run with slower network:

```bash
# Run tests with more timeout
npx cypress run --config defaultCommandTimeout=10000
```

## Quick Test Script

For convenience, here's a one-liner to run everything:

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp && \
docker-compose up -d && \
sleep 10 && \
cd frontend && \
npx cypress run --spec "cypress/e2e/recipe-simple.cy.js"
```

## Video and Screenshots

After running tests, check:

- **Videos**: `frontend/cypress/videos/` - Full test execution videos
- **Screenshots**: `frontend/cypress/screenshots/` - Screenshots of failures

## NPM Scripts Available

You can also use the pre-configured npm scripts:

```bash
cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend

# Run all tests
npm run e2e

# Open Cypress UI (requires X server)
npm run cypress:open

# Run in specific browser
npm run e2e:chrome
npm run e2e:firefox
```

## Clean Up After Testing

```bash
# Stop Docker containers
docker-compose down

# Clean up Cypress cache (optional)
npx cypress cache clear
```
