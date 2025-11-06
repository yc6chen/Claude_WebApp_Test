# Documentation Index

Quick reference guide to all documentation in the Recipe Management Application.

**Last Updated**: November 2025

## 📚 Getting Started

Start here if you're new to the project:

1. **[README.md](README.md)** - Project overview, quick start, and features
2. **[FEATURES.md](FEATURES.md)** - Detailed feature documentation
3. **[TESTING.md](TESTING.md)** - How to run and write tests

## 📖 Core Documentation

### Main Guides

| Document | Description | Audience |
|----------|-------------|----------|
| **[README.md](README.md)** | Project overview, setup, API reference | Everyone |
| **[FEATURES.md](FEATURES.md)** | Complete feature documentation | Developers, Users |
| **[TESTING.md](TESTING.md)** | Testing guide and strategies | Developers, QA |

### Feature-Specific Documentation

| Document | Description | Topics Covered |
|----------|-------------|----------------|
| **[AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md)** | Authentication system details | JWT, User accounts, Security |
| **[MEAL_PLANNING_FEATURE.md](MEAL_PLANNING_FEATURE.md)** | Meal planning implementation | Weekly calendar, Shopping lists, Unit conversion |

### Testing Documentation

| Document | Description | Contents |
|----------|-------------|----------|
| **[TESTING.md](TESTING.md)** | Main testing guide | All test types, coverage, CI/CD |
| **[TEST_RESULTS_MEAL_PLANNING.md](TEST_RESULTS_MEAL_PLANNING.md)** | Meal planning test results | 74 tests, fixes, coverage analysis |
| **[E2E_ENVIRONMENT_TUNING.md](E2E_ENVIRONMENT_TUNING.md)** | E2E test optimization | Playwright config, performance tuning |

### Maintenance & Development

| Document | Description | Use Case |
|----------|-------------|----------|
| **[DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md)** | How to maintain docs | When updating docs, adding features |

## 🗂️ Documentation by Topic

### Authentication
- **Overview**: [README.md#features](README.md#features) → User Authentication section
- **Implementation**: [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md)
- **API Endpoints**: [README.md#api-documentation](README.md#api-documentation)
- **Tests**: [TESTING.md](TESTING.md) → Backend Testing section

### Recipe Management
- **Overview**: [README.md#features](README.md#features) → Recipe Management section
- **Features**: [FEATURES.md#recipe-management](FEATURES.md#recipe-management)
- **API**: [README.md#api-documentation](README.md#api-documentation)
- **Tests**: [TESTING.md](TESTING.md)

### Meal Planning
- **Overview**: [README.md#features](README.md#features) → Meal Planning section
- **Implementation**: [MEAL_PLANNING_FEATURE.md](MEAL_PLANNING_FEATURE.md)
- **Features Guide**: [FEATURES.md#meal-planning](FEATURES.md#meal-planning)
- **Test Results**: [TEST_RESULTS_MEAL_PLANNING.md](TEST_RESULTS_MEAL_PLANNING.md)

### Shopping Lists
- **Overview**: [README.md#features](README.md#features) → Shopping List section
- **Implementation**: [MEAL_PLANNING_FEATURE.md](MEAL_PLANNING_FEATURE.md)
- **Features**: [FEATURES.md#shopping-list-generation](FEATURES.md#shopping-list-generation)
- **Unit Conversion**: [FEATURES.md#unit-conversion-system](FEATURES.md#unit-conversion-system)

### Testing
- **Quick Start**: [README.md#running-tests](README.md#running-tests)
- **Comprehensive Guide**: [TESTING.md](TESTING.md)
- **Meal Planning Tests**: [TEST_RESULTS_MEAL_PLANNING.md](TEST_RESULTS_MEAL_PLANNING.md)
- **E2E Configuration**: [E2E_ENVIRONMENT_TUNING.md](E2E_ENVIRONMENT_TUNING.md)

### Database
- **Schema Overview**: [README.md#database-schema](README.md#database-schema)
- **Detailed Schema**: [FEATURES.md#database-schema](FEATURES.md#database-schema)
- **Models**: Feature-specific docs for detailed model information

## 📁 E2E Testing Documentation

Located in `e2e/` directory:

- **[e2e/README.md](e2e/README.md)** - E2E testing overview
- **[e2e/E2E_TEST_DEBUGGING.md](e2e/E2E_TEST_DEBUGGING.md)** - Debugging E2E tests
- **[E2E_ENVIRONMENT_TUNING.md](E2E_ENVIRONMENT_TUNING.md)** - Performance optimization

## 🎯 Common Tasks

### "I want to..."

**...get started with the project**
→ Read [README.md](README.md), then follow Quick Start guide

**...understand a specific feature**
→ Check [FEATURES.md](FEATURES.md) for comprehensive documentation

**...run tests**
→ See [TESTING.md](TESTING.md) Quick Summary section

**...add a new feature**
→ Read [FEATURES.md](FEATURES.md) for patterns, [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md) for documentation standards

**...debug E2E tests**
→ See [e2e/E2E_TEST_DEBUGGING.md](e2e/E2E_TEST_DEBUGGING.md) and [E2E_ENVIRONMENT_TUNING.md](E2E_ENVIRONMENT_TUNING.md)

**...understand the database**
→ [FEATURES.md#database-schema](FEATURES.md#database-schema)

**...use the API**
→ [README.md#api-documentation](README.md#api-documentation)

**...contribute**
→ [README.md#contributing](README.md#contributing) + [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md)

## 📝 GitHub Templates

Located in `.github/`:

- **[.github/DOCUMENTATION_TEMPLATE.md](.github/DOCUMENTATION_TEMPLATE.md)** - Template for new feature docs
- **[.github/FEATURE_CHECKLIST.md](.github/FEATURE_CHECKLIST.md)** - Checklist for feature implementation

## 🔍 Finding Information

### By File Type

**Getting Started:**
- README.md

**Feature Documentation:**
- FEATURES.md
- AUTHENTICATION_IMPLEMENTATION.md
- MEAL_PLANNING_FEATURE.md

**Testing:**
- TESTING.md
- TEST_RESULTS_MEAL_PLANNING.md
- E2E_ENVIRONMENT_TUNING.md

**Maintenance:**
- DOCUMENTATION_MAINTENANCE.md

### Search Tips

1. **Use your IDE search**: Most IDEs can search across all markdown files
2. **Check the Table of Contents**: Each major doc has a TOC
3. **Follow cross-references**: Documents link to related content
4. **Start broad, get specific**: README → FEATURES → Implementation docs

## 📊 Documentation Statistics

- **Total Documentation Files**: 9 main files
- **E2E Docs**: 3 files
- **Templates**: 2 files
- **Total Lines**: ~5,000 lines
- **Topics Covered**: 20+ major topics

## 🆕 Recently Updated

- **November 2025**: Meal planning documentation, test results, E2E tuning
- **November 2025**: Documentation consolidation (reduced from 15 to 9 files)
- **October 2025**: Authentication implementation
- **October 2025**: Initial documentation structure

## ⚡ Quick Links

- [Start Here](README.md) - New to the project?
- [Features Overview](FEATURES.md) - What can this app do?
- [Run Tests](TESTING.md) - How to test?
- [API Reference](README.md#api-documentation) - API endpoints
- [Contributing](README.md#contributing) - How to contribute?

---

**Tip**: Bookmark this page for quick access to all documentation!

**Last Updated**: November 2025
