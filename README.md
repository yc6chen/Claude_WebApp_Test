# Personal Recipe Database App

A full-stack recipe management application with secure authentication, meal planning, and shopping list generation. Built with React, Django REST API, and PostgreSQL, all containerized with Docker.

## Features

### 🔐 User Authentication & Accounts
- JWT-based secure authentication
- User registration and login
- Password reset functionality
- Private recipes (visible only to owner)
- Public recipes (shareable with all users)
- Personal recipe collections

### 📖 Recipe Management
- Create, edit, and delete recipes
- Recipe fields: name, description, category, prep/cook time, difficulty, ingredients, instructions
- Dynamic ingredient list with measurements
- Dietary tags (vegan, vegetarian, gluten-free, dairy-free, nut-free, low-carb, keto, paleo, halal, kosher)
- Public/private visibility control
- Recipe favorites system

### 🔍 Search & Filtering
- Real-time search by recipe name
- Advanced filtering:
  - By difficulty level (easy, medium, hard)
  - By maximum prep/cook time
  - By included ingredients (e.g., "with chicken")
  - By excluded ingredients (e.g., "without mushrooms")
  - By dietary tags
  - By author (your recipes, favorites)
- Combine multiple filters simultaneously

### 📅 Meal Planning
- Weekly calendar view (Sunday-Saturday)
- Drag-and-drop recipe assignment to meal slots
- Support for multiple recipes per meal
- Breakfast, lunch, and dinner slots
- Week navigation and "Today" quick view
- Bulk operations (copy week, clear week, repeat meals)

### 🛒 Shopping List Generation
- Auto-generate from meal plan
- Intelligent ingredient aggregation
- Smart unit conversion (cups ↔ tbsp, lbs ↔ oz, etc.)
- Categorized by grocery department
- Check off items as you shop
- Progress tracking
- Add custom items
- Print and CSV export

### 🎨 User Interface
- Material Design 3 components (Material-UI v6)
- Responsive design for desktop and mobile
- Two-pane layout for easy browsing
- Dark mode support
- Intuitive navigation

## Tech Stack

- **Frontend**: React 18 + Material-UI v6
- **Backend**: Django 4.2 + Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose
- **Testing**: Jest, React Testing Library, pytest, Playwright

## Quick Start

### Prerequisites
- Docker Desktop
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TestWebApp
   ```

2. **Start all services**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000/api/
   - **Django Admin**: http://localhost:8000/admin/

4. **Create a superuser** (optional, for admin access)
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

### First Steps

1. **Register an account** at http://localhost:3000/register
2. **Log in** with your credentials
3. **Create your first recipe** using the "Add Recipe" button
4. **Plan your week** by navigating to Meal Planner from the user menu
5. **Generate a shopping list** from your meal plan

## Project Structure

```
TestWebApp/
├── backend/              # Django REST API
│   ├── backend/         # Django project settings
│   ├── recipes/         # Main app (models, views, serializers)
│   └── requirements.txt # Python dependencies
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API client
│   │   └── App.js      # Main app component
│   └── package.json    # Node dependencies
├── e2e/                # End-to-end tests (Playwright)
├── docker-compose.yml  # Docker orchestration
└── README.md          # This file
```

## Development

### Running Tests

**Backend Tests:**
```bash
# All tests
docker compose exec backend pytest

# With coverage
docker compose exec backend pytest --cov=recipes --cov-report=html

# Specific test file
docker compose exec backend pytest recipes/tests/test_meal_plans.py
```

**Frontend Tests:**
```bash
# All tests
docker compose exec frontend npm test

# With coverage
docker compose exec frontend npm test -- --coverage

# Specific test file
docker compose exec frontend npm test -- MealPlanner.test.js
```

**E2E Tests:**
```bash
cd e2e
docker compose run --rm playwright npx playwright test
```

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

### API Documentation

The API is RESTful and follows standard conventions:

**Authentication Endpoints:**
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset

**Recipe Endpoints:**
- `GET /api/recipes/` - List all accessible recipes
- `POST /api/recipes/` - Create new recipe
- `GET /api/recipes/{id}/` - Get recipe details
- `PUT /api/recipes/{id}/` - Update recipe
- `DELETE /api/recipes/{id}/` - Delete recipe
- `POST /api/recipes/{id}/favorite/` - Toggle favorite
- `GET /api/recipes/my_recipes/` - Get user's recipes
- `GET /api/recipes/favorites/` - Get favorited recipes

**Meal Planning Endpoints:**
- `GET /api/meal-plans/` - List meal plans
- `POST /api/meal-plans/` - Create meal plan
- `GET /api/meal-plans/week/` - Get week view
- `POST /api/meal-plans/bulk_operation/` - Bulk operations

**Shopping List Endpoints:**
- `GET /api/shopping-lists/` - List shopping lists
- `POST /api/shopping-lists/generate/` - Generate from meal plan
- `POST /api/shopping-lists/{id}/add_item/` - Add custom item
- `POST /api/shopping-list-items/{id}/toggle_check/` - Check/uncheck item

## Features Documentation

For detailed feature documentation, see:
- **[FEATURES.md](FEATURES.md)** - Comprehensive feature implementation details
- **[TESTING.md](TESTING.md)** - Testing strategies and results
- **[DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md)** - How to maintain docs

## Database Schema

### Key Models

**User** (Django built-in)
- username, email, password
- Authentication and authorization

**Recipe**
- name, description, category
- prep_time, cook_time, difficulty
- is_public (visibility control)
- author (ForeignKey to User)
- ingredients (related Ingredient model)
- dietary_tags (JSONField)

**MealPlan**
- user, recipe, date, meal_type
- Tracks what recipes are planned for specific meals

**ShoppingList & ShoppingListItem**
- Generated from meal plans
- Aggregated ingredients with unit conversion
- Categorized by grocery department

See [FEATURES.md](FEATURES.md) for complete schema details.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

## Test Coverage

- **Backend**: 92% coverage (168 tests)
- **Frontend**: ~75% coverage (191 tests)
- **E2E**: 6 comprehensive workflows

**Total**: 365+ tests across all layers

## License

This project is for educational purposes.

## Support

For issues, questions, or contributions:
1. Check existing documentation in `/docs` or markdown files
2. Review [TESTING.md](TESTING.md) for test-related issues
3. Check [FEATURES.md](FEATURES.md) for feature details
4. Open an issue with detailed description

---

**Last Updated**: November 2025
