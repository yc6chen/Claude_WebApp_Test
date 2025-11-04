# Personal Recipe Database App

A full-stack recipe management application with a React frontend, Django REST API backend, and PostgreSQL database, all containerized with Docker.

## Features

### Core Features
- Two-pane layout: recipe list and detailed view
- Add new recipes with a Material Design 3 modal
- Recipe fields: name, description, category, prep time, cook time, difficulty, and dynamic ingredient list
- Delete recipes
- Material Design 3 UI components from Material-UI v6

### Search & Filtering (New)
- **Search by name**: Real-time search for recipes by name
- **Advanced filters** (collapsible panel):
  - Filter by difficulty level (easy, medium, hard)
  - Filter by maximum prep time
  - Filter by maximum cook time
  - Include specific ingredients (e.g., "recipes with chicken")
  - Exclude specific ingredients (e.g., "recipes without mushrooms")
  - Filter by dietary tags (vegan, gluten-free, etc.)
- **Combine multiple filters**: All filters work simultaneously
- **Dietary tags**: Add dietary information to recipes (vegan, vegetarian, gluten-free, dairy-free, nut-free, low-carb, keto, paleo, halal, kosher)

## Tech Stack

- **Frontend**: React 18 with Material-UI v6 (Material Design 3)
- **Backend**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL 15
- **Containerization**: Docker and Docker Compose

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Start all services:
```bash
docker-compose up --build
```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/recipes/
   - Django Admin: http://localhost:8000/admin/

3. To stop the application:
```bash
docker-compose down
```

### Creating a Django Admin User (Optional)

To access the Django admin panel:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts to create your admin account.

## Project Structure

```
.
├── backend/
│   ├── recipe_project/       # Django project settings
│   ├── recipes/              # Recipes app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## API Endpoints

### Recipe Management
- `GET /api/recipes/` - List all recipes
- `POST /api/recipes/` - Create a new recipe
- `GET /api/recipes/{id}/` - Get a specific recipe
- `PUT /api/recipes/{id}/` - Update a recipe
- `DELETE /api/recipes/{id}/` - Delete a recipe

### Search & Filtering Query Parameters
All filters can be combined on the `GET /api/recipes/` endpoint:

- `?search=name` - Search recipes by name (case-insensitive)
- `?difficulty=easy` - Filter by difficulty (easy, medium, hard)
- `?max_prep_time=30` - Filter by maximum prep time in minutes
- `?max_cook_time=45` - Filter by maximum cook time in minutes
- `?include_ingredients=chicken,rice` - Include recipes with all specified ingredients (comma-separated)
- `?exclude_ingredients=mushrooms,nuts` - Exclude recipes with any specified ingredients (comma-separated)
- `?dietary_tags=vegan,gluten_free` - Filter recipes with all specified dietary tags (comma-separated)

**Example**: `/api/recipes/?search=chicken&difficulty=easy&max_prep_time=30&dietary_tags=gluten_free`

## Testing

This project includes comprehensive test suites across all layers:

- **Backend**: 124 pytest tests with 98.7% coverage
- **Frontend**: 160 React Testing Library tests with 78.7% coverage (1 skipped test - see notes)
- **E2E**: 29 Playwright tests covering complete user workflows

### Quick Start
```bash
# Backend tests
cd backend && pytest --cov=recipes

# Frontend tests
cd frontend && npm test -- --watchAll=false

# E2E tests (Playwright in Docker)
./run-e2e-tests.sh
```

For detailed testing information, see:
- [TEST_QUICK_START.md](./TEST_QUICK_START.md) - Quick reference guide
- [TESTING.md](./TESTING.md) - Comprehensive testing documentation (Backend, Frontend, E2E)

## Development

The application uses volume mounting for hot-reloading during development:
- Frontend changes will automatically reload
- Backend changes will automatically reload the Django development server

## Documentation

### For Contributors

**Important**: When adding new features or tests, please update the relevant documentation files.

A comprehensive documentation update system is in place:
- See [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md) for detailed guidelines and system overview
- Use [.github/FEATURE_CHECKLIST.md](./.github/FEATURE_CHECKLIST.md) as a template when adding features

### Available Documentation

**Core Documentation:**
- [README.md](./README.md) - This file, project overview
- [TESTING.md](./TESTING.md) - Comprehensive testing guide (Backend, Frontend, E2E)
- [TEST_QUICK_START.md](./TEST_QUICK_START.md) - Quick testing reference

**Maintenance & Contributing:**
- [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md) - Guidelines for updating docs and system overview
- [.github/FEATURE_CHECKLIST.md](./.github/FEATURE_CHECKLIST.md) - Feature addition checklist template
- [.github/DOCUMENTATION_TEMPLATE.md](./.github/DOCUMENTATION_TEMPLATE.md) - Template for new documentation files

**Testing Best Practices:**
- [backend/TEST_IMPROVEMENTS.md](./backend/TEST_IMPROVEMENTS.md) - Pytest improvements and patterns
- [frontend/TEST_IMPROVEMENTS.md](./frontend/TEST_IMPROVEMENTS.md) - React Testing Library improvements and patterns
