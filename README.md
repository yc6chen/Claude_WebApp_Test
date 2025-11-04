# Personal Recipe Database App

A full-stack recipe management application with a React frontend, Django REST API backend, and PostgreSQL database, all containerized with Docker.

## Features

### Authentication & User Management
- **User Registration**: Secure account creation with email validation
- **User Login**: JWT-based authentication with access and refresh tokens
- **User Profiles**: Customizable profiles with bio and avatar
- **Password Security**: PBKDF2 hashing with Django's password validation
- **Token Management**: Automatic token refresh, rotation, and blacklisting
- **Protected Routes**: Authentication-required pages in frontend

### Recipe Ownership & Privacy
- **Recipe Ownership**: Recipes belong to users, owners can edit/delete
- **Private Recipes**: Toggle recipes between public and private visibility
- **My Recipes**: Personal collection of user's recipes
- **Favorites System**: Save and organize favorite recipes
- **Authorization**: Owner-based permissions for update/delete operations

### Core Features
- Two-pane layout: recipe list and detailed view
- Add new recipes with a Material Design 3 modal
- Recipe fields: name, description, category, prep time, cook time, difficulty, and dynamic ingredient list
- Delete recipes (owner only)
- Material Design 3 UI components from Material-UI v6

### Search & Filtering
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

- **Frontend**: React 18 with Material-UI v6 (Material Design 3), React Router v6
- **Backend**: Django 4.2 with Django REST Framework
- **Authentication**: djangorestframework-simplejwt (JWT tokens)
- **Database**: PostgreSQL 15
- **Containerization**: Docker and Docker Compose
- **Testing**: pytest (backend), React Testing Library (frontend), Playwright (E2E)

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

### Authentication Endpoints
- `POST /api/auth/register/` - Register new user (public)
- `POST /api/auth/login/` - Login and receive JWT tokens (public)
- `POST /api/auth/logout/` - Logout and blacklist refresh token (requires auth)
- `POST /api/auth/token/refresh/` - Refresh access token (public, requires refresh token)
- `GET /api/auth/user/` - Get current user info (requires auth)
- `GET /api/auth/profile/` - Get user profile (requires auth)
- `PUT/PATCH /api/auth/profile/` - Update user profile (requires auth)

### Recipe Management
- `GET /api/recipes/` - List all public recipes (+ user's private recipes if authenticated)
- `POST /api/recipes/` - Create a new recipe (requires auth, auto-assigns owner)
- `GET /api/recipes/{id}/` - Get a specific recipe (private recipes require ownership)
- `PUT /api/recipes/{id}/` - Update a recipe (requires ownership)
- `DELETE /api/recipes/{id}/` - Delete a recipe (requires ownership)
- `GET /api/recipes/my_recipes/` - Get current user's recipes (requires auth)
- `GET /api/recipes/favorites/` - Get user's favorited recipes (requires auth)
- `POST /api/recipes/{id}/favorite/` - Favorite a recipe (requires auth)
- `DELETE /api/recipes/{id}/unfavorite/` - Unfavorite a recipe (requires auth)

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

- **Backend**: 124 pytest tests with 93.78% coverage
- **Frontend**: 160 React Testing Library tests with 78.7% coverage (1 skipped test - see notes)
- **E2E**: 29 Playwright tests covering complete user workflows

All backend tests passing (124/124 ✅), including:
- Authentication and authorization tests
- Recipe ownership and privacy tests
- User profile and favorites tests
- API endpoint tests with permissions

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
- [TESTING.md](./TESTING.md) - Comprehensive testing documentation
- [TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md) - Test suite overview
- [FINAL_TEST_RESULTS.md](./FINAL_TEST_RESULTS.md) - Latest test results (124/124 passing)
- [e2e/README.md](./e2e/README.md) - E2E testing with Playwright

## Development

The application uses volume mounting for hot-reloading during development:
- Frontend changes will automatically reload
- Backend changes will automatically reload the Django development server

## Documentation

### For Contributors

**Important**: When adding new features or tests, please update the relevant documentation files.

A comprehensive documentation update system is in place:
- See [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md) for detailed guidelines
- See [DOCUMENTATION_UPDATE_SYSTEM.md](./DOCUMENTATION_UPDATE_SYSTEM.md) for system overview
- Use [.github/FEATURE_CHECKLIST.md](./.github/FEATURE_CHECKLIST.md) as a template when adding features

### Available Documentation

**Core Documentation:**
- [README.md](./README.md) - This file, project overview
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [TEST_QUICK_START.md](./TEST_QUICK_START.md) - Quick testing reference
- [TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md) - Test suite summary

**Authentication Documentation:**
- [AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md) - Authentication system technical guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide for authentication features
- [FINAL_TEST_RESULTS.md](./FINAL_TEST_RESULTS.md) - Complete test results (124/124 passing)
- [COMPREHENSIVE_PROJECT_SUMMARY.md](./COMPREHENSIVE_PROJECT_SUMMARY.md) - Complete project summary

**Maintenance & Contributing:**
- [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md) - Guidelines for updating docs
- [DOCUMENTATION_UPDATE_SYSTEM.md](./DOCUMENTATION_UPDATE_SYSTEM.md) - System overview
- [.github/FEATURE_CHECKLIST.md](./.github/FEATURE_CHECKLIST.md) - Feature addition checklist template
- [.github/DOCUMENTATION_TEMPLATE.md](./.github/DOCUMENTATION_TEMPLATE.md) - Template for new documentation files
