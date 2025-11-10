# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline setup for the Recipe Management Application.

## Overview

The CI/CD pipeline is implemented using **GitHub Actions** and automatically runs on:
- Every push to the `main` branch
- Every pull request targeting the `main` branch
- Every push to feature branches (for testing)

## Pipeline Architecture

The pipeline consists of 5 parallel jobs that run concurrently for faster feedback:

```
┌─────────────────┐
│   Push/PR       │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Trigger │
    └────┬────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
┌───┴────┐  ┌────────┐  ┌────────┐  ┌┴─────┐  ┌──────┐
│Backend │  │Backend │  │Frontend│  │Frontend│  │Docker│
│Tests   │  │Lint    │  │Tests   │  │Lint    │  │Build │
└───┬────┘  └────┬───┘  └────┬───┘  └┬───────┘  └──┬───┘
    │            │           │       │             │
    └────────────┴───────────┴───────┴─────────────┘
                        │
                 ┌──────┴──────┐
                 │ CI Success  │
                 └─────────────┘
```

## Jobs Description

### 1. Backend Tests (`backend-test`)

**Purpose:** Run all backend unit and integration tests with PostgreSQL database.

**Steps:**
1. Checkout code
2. Set up Python 3.11 with pip caching
3. Install dependencies from `requirements.txt`
4. Start PostgreSQL 15 service container
5. Run Django migrations
6. Execute pytest with coverage
7. Upload coverage report to Codecov

**Environment:**
- Python: 3.11
- PostgreSQL: 15-alpine
- Test Framework: pytest
- Coverage Tool: pytest-cov

**Coverage:**
- Target: 90%+ (configured in `pytest.ini`)
- Current: 92.3% (168 tests)

**Duration:** ~2-3 minutes

### 2. Backend Linting (`backend-lint`)

**Purpose:** Ensure code quality and consistency using flake8.

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install flake8 and plugins
4. Run flake8 with configuration from `.flake8`

**Linting Rules:**
- Max line length: 127 characters
- Max complexity: 10 (McCabe)
- Excludes: migrations, static files, media, __pycache__
- Configuration: `backend/.flake8`

**Duration:** ~30 seconds

### 3. Frontend Tests (`frontend-test`)

**Purpose:** Run all React component tests with coverage reporting.

**Steps:**
1. Checkout code
2. Set up Node.js 18 with npm caching
3. Install dependencies with `npm ci`
4. Run Jest tests with coverage
5. Upload coverage to Codecov

**Environment:**
- Node.js: 18
- Test Framework: Jest + React Testing Library
- Coverage: 75%+ (191 tests)

**Duration:** ~2-3 minutes

### 4. Frontend Linting (`frontend-lint`)

**Purpose:** Ensure React code quality using ESLint.

**Steps:**
1. Checkout code
2. Set up Node.js 18
3. Install dependencies
4. Run ESLint

**Linting Rules:**
- Extends: `react-app`, `react-app/jest`
- Warnings: `no-console`, `no-unused-vars`
- Configuration: `frontend/.eslintrc.json`

**Duration:** ~30 seconds

### 5. Docker Build (`docker-build`)

**Purpose:** Verify that Docker images build successfully.

**Steps:**
1. Checkout code
2. Set up Docker Buildx
3. Build backend image (no push)
4. Build frontend image (no push)
5. Use GitHub Actions cache for layers

**Benefits:**
- Catches Dockerfile syntax errors
- Validates multi-stage builds
- Caches layers for faster subsequent builds

**Duration:** ~1-2 minutes (with cache)

### 6. CI Success (`ci-success`)

**Purpose:** Aggregate status of all jobs for branch protection rules.

**Logic:**
- Runs after all other jobs complete
- Checks if all jobs succeeded
- Fails if any job failed
- Used as required status check for PRs

## Configuration Files

### GitHub Actions Workflow
- **Location:** `.github/workflows/ci.yml`
- **Triggers:** Push to main, pull requests
- **Concurrency:** Jobs run in parallel

### Backend Configuration
- **Linting:** `backend/.flake8`
- **Testing:** `backend/pytest.ini`
- **Dependencies:** `backend/requirements.txt`

### Frontend Configuration
- **Linting:** `frontend/.eslintrc.json`, `frontend/.eslintignore`
- **Dependencies:** `frontend/package.json`

### Coverage Reporting
- **Configuration:** `codecov.yml`
- **Flags:** `backend`, `frontend`
- **Integration:** Codecov GitHub App

## Setting Up the Pipeline

### Prerequisites

1. **GitHub Repository:** Project must be hosted on GitHub
2. **Codecov Account:** Sign up at https://codecov.io (optional but recommended)

### First-Time Setup

1. **Enable GitHub Actions:**
   - GitHub automatically enables Actions for new repositories
   - Check: Settings → Actions → General

2. **Configure Codecov (Optional):**
   - Visit https://codecov.io and sign in with GitHub
   - Add the repository
   - Copy the upload token (usually not needed for public repos)
   - Add token as GitHub secret: Settings → Secrets → `CODECOV_TOKEN`

3. **Branch Protection Rules (Recommended):**
   - Go to Settings → Branches → Add rule
   - Branch name pattern: `main`
   - Enable: "Require status checks to pass before merging"
   - Select required checks: `CI Success`
   - Enable: "Require branches to be up to date before merging"

### Running Locally

You can run the same checks locally before pushing:

```bash
# Backend tests
docker compose exec backend pytest --cov=recipes --cov-report=term

# Backend linting
docker compose exec backend flake8

# Frontend tests
docker compose exec frontend npm test -- --coverage --watchAll=false

# Frontend linting
docker compose exec frontend npm run lint

# Docker builds
docker compose build
```

## CI/CD Workflow for Developers

### Standard Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/my-feature
   ```

4. **CI pipeline runs automatically:**
   - View status in GitHub Actions tab
   - See results in ~3-5 minutes

5. **Create pull request:**
   - GitHub shows CI status on PR
   - Green checkmark = all tests passed
   - Red X = something failed

6. **Fix issues if any:**
   ```bash
   # Make fixes
   git add .
   git commit -m "Fix linting issues"
   git push origin feature/my-feature
   # CI runs again automatically
   ```

7. **Merge when green:**
   - CI must pass before merging
   - Use "Squash and merge" for clean history

### Handling CI Failures

#### Backend Test Failures
```bash
# Run tests locally to debug
docker compose exec backend pytest -v

# Run specific failing test
docker compose exec backend pytest recipes/tests/test_api.py::test_recipe_create -v

# Check logs
docker compose logs backend
```

#### Linting Failures
```bash
# See all linting errors
docker compose exec backend flake8
docker compose exec frontend npm run lint

# Auto-fix some issues (frontend)
docker compose exec frontend npm run lint -- --fix
```

#### Coverage Drop
```bash
# Check coverage report
docker compose exec backend pytest --cov=recipes --cov-report=term-missing

# See which lines are not covered
docker compose exec backend pytest --cov=recipes --cov-report=html
# Then open backend/htmlcov/index.html
```

## Performance Optimization

### Caching Strategy

The pipeline uses several caching mechanisms:

1. **pip cache:** Python dependencies cached by `setup-python@v4`
2. **npm cache:** Node dependencies cached by `setup-node@v4`
3. **Docker layer cache:** BuildKit cache via GitHub Actions cache

**Benefits:**
- First run: ~8-10 minutes
- Subsequent runs: ~3-5 minutes (60% faster)

### Parallel Execution

Jobs run in parallel, not sequentially:
- **Without parallelization:** 10 minutes
- **With parallelization:** 3 minutes (70% faster)

## Future Enhancements

### Planned Improvements

1. **Deployment Stage:**
   - Add `deploy` job that runs after `ci-success`
   - Deploy to staging on push to `main`
   - Deploy to production on git tag

2. **E2E Tests in CI:**
   - Add Playwright E2E tests to pipeline
   - Run in headless mode with video recording
   - Upload test artifacts on failure

3. **Security Scanning:**
   - Add `safety` for Python dependency scanning
   - Add `npm audit` for JavaScript dependencies
   - Add Snyk integration

4. **Performance Testing:**
   - Add load testing with Locust
   - Track API response times
   - Alert on performance regression

5. **Automated Releases:**
   - Semantic versioning with `semantic-release`
   - Auto-generate changelogs
   - Create GitHub releases

## Troubleshooting

### Common Issues

#### Issue: "Service container failed to start"
**Cause:** PostgreSQL container didn't start in time
**Solution:** Increase health check interval in workflow

#### Issue: "Cannot find module 'react-scripts'"
**Cause:** npm dependencies not installed properly
**Solution:** Use `npm ci` instead of `npm install` (already done)

#### Issue: "Coverage decreased"
**Cause:** New code added without tests
**Solution:** Add tests for new code, or adjust coverage threshold

#### Issue: "Docker build failed: no space left"
**Cause:** GitHub runner out of disk space
**Solution:** Add cleanup step to remove unused Docker images

### Getting Help

- **GitHub Actions Logs:** Check the detailed logs in the Actions tab
- **Local Reproduction:** Try to reproduce the issue locally
- **Documentation:** See [GitHub Actions Docs](https://docs.github.com/en/actions)

## Metrics & Monitoring

### Key Metrics

Track these metrics to ensure pipeline health:

1. **Success Rate:** % of CI runs that pass
   - Target: >95%
   - Current: Monitor in GitHub Actions

2. **Duration:** Time from push to CI complete
   - Target: <5 minutes
   - Current: ~3-5 minutes

3. **Coverage:** Test coverage percentage
   - Backend Target: >90%
   - Frontend Target: >75%
   - Current: 93.78% overall

4. **Flakiness:** Tests that fail intermittently
   - Target: 0 flaky tests
   - Track: Manual monitoring

### Viewing Metrics

```bash
# GitHub CLI - view recent workflow runs
gh run list --workflow=ci.yml --limit 20

# View specific run
gh run view <run-id>

# Check coverage trends
# Visit: https://app.codecov.io/gh/<username>/<repo>
```

## Best Practices

### Writing CI-Friendly Code

1. **Deterministic Tests:** Tests should always produce the same result
2. **Fast Tests:** Keep unit tests under 1 second each
3. **Isolated Tests:** Tests shouldn't depend on each other
4. **Clear Assertions:** Use descriptive assertion messages

### Maintaining the Pipeline

1. **Keep dependencies updated:** Update GitHub Actions monthly
2. **Monitor pipeline duration:** Alert if >10 minutes
3. **Review failed builds:** Don't ignore intermittent failures
4. **Update documentation:** Keep this file in sync with changes

### Security Considerations

1. **Secrets Management:** Never commit secrets to the repository
2. **Token Permissions:** Use minimal permissions for GitHub tokens
3. **Dependency Scanning:** Review security alerts weekly
4. **Code Review:** Require review before merging to main

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pytest Documentation](https://docs.pytest.org/)
- [flake8 Documentation](https://flake8.pycqa.org/)
- [ESLint Documentation](https://eslint.org/)
- [Codecov Documentation](https://docs.codecov.com/)
- [Docker Buildx Documentation](https://docs.docker.com/buildx/)

---

**Last Updated:** 2025-01-06
**Maintained By:** Development Team
