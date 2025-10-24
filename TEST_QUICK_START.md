# Test Suite Quick Start Guide

Quick reference for running tests in the Recipe Management Application.

## 🚀 Quick Commands

### Backend Tests (Django/pytest)

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=recipes --cov-report=html

# Run specific test file
pytest recipes/tests/test_models.py
pytest recipes/tests/test_serializers.py
pytest recipes/tests/test_api.py

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Verbose output
pytest -v

# Stop at first failure
pytest -x
```

### Frontend Tests (React/Jest)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test AddRecipeModal.test.js

# Run tests matching pattern
npm test -- --testNamePattern="displays recipe"
```

## 📊 Expected Output

### Backend Success

```
======================== test session starts =========================
collected 120 items

recipes/tests/test_models.py ................................  [ 33%]
recipes/tests/test_serializers.py ..........................  [ 58%]
recipes/tests/test_api.py ....................................  [100%]

======================== 120 passed in 5.23s =========================

---------- coverage: platform linux, python 3.9.7 ----------
Name                              Stmts   Miss  Cover
-----------------------------------------------------
recipes/models.py                    45      2    96%
recipes/serializers.py               28      1    96%
recipes/views.py                      8      0   100%
-----------------------------------------------------
TOTAL                               81      3    96%
```

### Frontend Success

```
PASS  src/components/AddRecipeModal.test.js (8.234s)
PASS  src/components/RecipeList.test.js (6.123s)
PASS  src/components/RecipeDetail.test.js (5.456s)
PASS  src/App.test.js (12.789s)

Test Suites: 4 passed, 4 total
Tests:       130 passed, 130 total
Snapshots:   0 total
Time:        32.602s

--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.23 |    78.45 |   88.67 |   86.12 |
 App.js             |   92.31 |    85.71 |   90.00 |   91.67 |
 AddRecipeModal.js  |   88.24 |    76.92 |   87.50 |   89.13 |
 RecipeList.js      |   82.35 |    75.00 |   85.71 |   83.33 |
 RecipeDetail.js    |   80.00 |    72.73 |   87.50 |   81.25 |
--------------------|---------|----------|---------|---------|
```

## 🐛 Debugging Failed Tests

### Backend

```bash
# Run with detailed output
pytest -vv

# Show print statements
pytest -s

# Drop into debugger on failure
pytest --pdb

# Only run failed tests from last run
pytest --lf

# Run tests with specific keyword
pytest -k "ingredient"
```

### Frontend

```bash
# Run with verbose output
npm test -- --verbose

# Show console.log statements
npm test -- --silent=false

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand AddRecipeModal.test.js
```

## 📝 Test File Locations

### Backend
```
backend/recipes/tests/
├── __init__.py
├── test_models.py        # 40+ tests for Recipe & Ingredient models
├── test_serializers.py   # 30+ tests for serializers
└── test_api.py          # 50+ tests for REST API endpoints
```

### Frontend
```
frontend/src/
├── App.test.js                        # 30+ integration tests
└── components/
    ├── AddRecipeModal.test.js        # 40+ component tests
    ├── RecipeList.test.js            # 45+ component tests
    └── RecipeDetail.test.js          # 40+ component tests
```

## 🎯 Test Coverage Goals

- **Backend**: 90%+ coverage
- **Frontend**: 80%+ coverage
- **Models**: 95%+ coverage
- **API Endpoints**: 90%+ coverage

## 🔧 Common Issues & Solutions

### Backend

**Issue**: Database connection error
```bash
# Solution: Use in-memory SQLite for tests (already configured)
pytest --ds=recipe_project.settings
```

**Issue**: Import errors
```bash
# Solution: Install all dependencies
pip install -r requirements.txt
```

### Frontend

**Issue**: Tests timeout
```bash
# Solution: Increase timeout
npm test -- --testTimeout=10000
```

**Issue**: Mock warnings
```bash
# Solution: Check setupTests.js is properly configured
# Ensure fetch mock is reset between tests
```

## 📚 Test Categories

### Backend Tests

| Category | Count | File | Time |
|----------|-------|------|------|
| Model Tests | 40+ | test_models.py | ~2s |
| Serializer Tests | 30+ | test_serializers.py | ~1.5s |
| API Tests | 50+ | test_api.py | ~2.5s |
| **Total** | **120+** | | **~6s** |

### Frontend Tests

| Category | Count | File | Time |
|----------|-------|------|------|
| AddRecipeModal | 40+ | AddRecipeModal.test.js | ~8s |
| RecipeList | 45+ | RecipeList.test.js | ~6s |
| RecipeDetail | 40+ | RecipeDetail.test.js | ~5s |
| App Integration | 30+ | App.test.js | ~13s |
| **Total** | **155+** | | **~32s** |

## 🚢 CI/CD Integration

### Run All Tests (Bash)

```bash
#!/bin/bash
# test_all.sh

echo "🧪 Running Backend Tests..."
cd backend && pytest --cov=recipes --cov-report=term-missing
BACKEND_EXIT=$?

echo "🧪 Running Frontend Tests..."
cd ../frontend && npm test -- --watchAll=false --coverage
FRONTEND_EXIT=$?

if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed!"
    exit 1
fi
```

### Docker

```bash
# Run backend tests in Docker
docker-compose exec backend pytest --cov=recipes

# Run frontend tests in Docker
docker-compose exec frontend npm test -- --watchAll=false

# Run all tests
docker-compose exec backend pytest && \
docker-compose exec frontend npm test -- --watchAll=false
```

## 💡 Pro Tips

1. **Use watch mode during development**:
   - Frontend: `npm test` (default watch mode)
   - Backend: `pytest-watch` (install with `pip install pytest-watch`)

2. **Run related tests only**:
   - `pytest -k "recipe"` - Only tests with "recipe" in name
   - `npm test Recipe` - Only Recipe component tests

3. **Generate HTML coverage reports**:
   - Backend: `pytest --cov=recipes --cov-report=html` → `htmlcov/index.html`
   - Frontend: `npm test -- --coverage` → `coverage/lcov-report/index.html`

4. **Parallel execution**:
   - Backend: `pytest -n auto` (requires `pytest-xdist`)
   - Frontend: Jest runs tests in parallel by default

5. **Watch for changes**:
   - Backend: `ptw` (pytest-watch)
   - Frontend: `npm test` (default)

## 📖 Full Documentation

For detailed information, see [TESTING.md](./TESTING.md)

## ✅ Checklist

Before committing code, ensure:

- [ ] All backend tests pass: `cd backend && pytest`
- [ ] All frontend tests pass: `cd frontend && npm test -- --watchAll=false`
- [ ] Coverage meets thresholds (90% backend, 80% frontend)
- [ ] New features have corresponding tests
- [ ] No console errors or warnings
- [ ] Tests run in reasonable time (< 1 minute total)

---

**Questions?** Check [TESTING.md](./TESTING.md) for comprehensive documentation.
