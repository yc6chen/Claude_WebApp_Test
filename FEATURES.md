# Features Documentation

Comprehensive documentation for all implemented features in the Recipe Management Application.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Recipe Management](#recipe-management)
3. [Meal Planning](#meal-planning)
4. [Shopping List Generation](#shopping-list-generation)
5. [Database Schema](#database-schema)

---

## Authentication System

### Overview

Secure JWT-based authentication with user accounts, privacy controls, and password management.

### Features Implemented

#### User Registration & Login
- **Registration**: Create new user accounts with username, email, and password
- **Login**: JWT token-based authentication
- **Token Refresh**: Automatic token refresh for persistent sessions
- **Logout**: Clear tokens and session data

#### User Account Management
- **Profile Management**: View and edit user profile
- **Password Reset**: Email-based password reset flow
- **Password Change**: Change password while logged in
- **Account Settings**: Manage user preferences

#### Privacy & Security
- **Private Recipes**: Recipes visible only to the owner
- **Public Recipes**: Recipes shared with all users
- **Favorites System**: Bookmark and organize favorite recipes
- **User Isolation**: Complete data separation between users

### API Endpoints

```
POST   /api/auth/register/              # Register new user
POST   /api/auth/login/                 # Login (get tokens)
POST   /api/auth/refresh/               # Refresh access token
POST   /api/auth/password-reset/        # Request password reset
POST   /api/auth/password-reset-confirm # Confirm password reset
GET    /api/auth/user/                  # Get current user info
PATCH  /api/auth/user/                  # Update user profile
```

### Frontend Components

- **Login.js**: Login form with JWT handling
- **Register.js**: User registration form
- **ProtectedRoute.js**: Route wrapper for authenticated pages
- **Navigation**: User menu with profile, logout
- **AuthContext**: Global authentication state management

### Security Features

1. **JWT Tokens**:
   - Access token: 15-minute expiration
   - Refresh token: 7-day expiration
   - Automatic refresh on API calls

2. **Password Requirements**:
   - Minimum 8 characters
   - Django password validation
   - Secure storage (bcrypt hashing)

3. **CORS Configuration**:
   - Allowed origins configured
   - Credentials support enabled
   - Secure headers set

4. **Authorization**:
   - Token required for all protected endpoints
   - User can only access/modify their own data
   - Recipe visibility controls (public/private)

### Database Models

**User** (Django built-in with extensions):
```python
User:
  - id (PK)
  - username (unique)
  - email (unique)
  - password (hashed)
  - first_name
  - last_name
  - date_joined
  - last_login
```

**Recipe Extensions**:
```python
Recipe:
  - ...
  - author (FK to User)
  - is_public (Boolean)
  - created_at
  - updated_at
```

**Favorite**:
```python
Favorite:
  - id (PK)
  - user (FK to User)
  - recipe (FK to Recipe)
  - created_at
  - UNIQUE(user, recipe)
```

### Implementation Details

See [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md) for complete implementation details, including:
- Detailed API specifications
- Frontend state management
- Security considerations
- Testing strategies

---

## Recipe Management

### Overview

Complete CRUD operations for recipes with advanced search and filtering capabilities.

### Core Features

#### Recipe Creation
- Name, description, category
- Prep time and cook time
- Difficulty level (easy, medium, hard)
- Dynamic ingredient list with measurements
- Step-by-step instructions
- Dietary tags (10+ supported tags)
- Public/private visibility toggle

#### Recipe Editing
- Edit all recipe fields
- Add/remove ingredients dynamically
- Update instructions
- Change visibility settings

#### Recipe Deletion
- Delete owned recipes
- Confirmation dialog
- Cascade delete related data

#### Recipe Viewing
- Detailed recipe view
- Ingredient list with measurements
- Step-by-step instructions
- Prep/cook time display
- Difficulty indicators
- Dietary tag badges

### Search & Filtering

#### Basic Search
- Real-time search by recipe name
- Searches in name and description
- Instant results

#### Advanced Filters
- **Difficulty**: Easy, Medium, Hard
- **Prep Time**: Maximum minutes
- **Cook Time**: Maximum minutes
- **Include Ingredients**: Recipes containing specific ingredients
- **Exclude Ingredients**: Recipes without certain ingredients
- **Dietary Tags**: Filter by dietary requirements
- **Author**: My recipes, all recipes, favorites

#### Filter Combinations
- All filters work simultaneously
- Dynamic result updates
- Clear filters option

### API Endpoints

```
GET    /api/recipes/                    # List recipes (with filters)
POST   /api/recipes/                    # Create recipe
GET    /api/recipes/{id}/               # Get recipe details
PUT    /api/recipes/{id}/               # Update recipe
DELETE /api/recipes/{id}/               # Delete recipe
POST   /api/recipes/{id}/favorite/      # Toggle favorite
GET    /api/recipes/my_recipes/         # Get user's recipes
GET    /api/recipes/favorites/          # Get favorited recipes
```

### Query Parameters

```
?search=<text>                 # Search by name
?difficulty=<easy|medium|hard> # Filter by difficulty
?max_prep_time=<minutes>       # Max prep time
?max_cook_time=<minutes>       # Max cook time
?include_ingredients=<list>    # Must include these
?exclude_ingredients=<list>    # Must not include these
?dietary_tags=<list>           # Filter by tags
?is_public=<true|false>        # Public/private
```

---

## Meal Planning

### Overview

Weekly meal planning system with calendar view, recipe assignments, and bulk operations.

### Features

#### Weekly Calendar
- Sunday-Saturday grid layout
- Three meal types per day: Breakfast, Lunch, Dinner
- Current week display with date range
- Week navigation (previous/next)
- "Today" quick navigation button

#### Meal Assignment
- Add recipes to specific meal slots
- Multiple recipes per meal slot
- Recipe selector modal with search
- Drag-and-drop support (future enhancement)
- Notes per meal plan entry

#### Recipe Selector
- Search recipes in modal
- Filter by category, difficulty
- View recipe details before adding
- Quick add to selected slot

#### Bulk Operations
- **Copy Week**: Duplicate current week to another week
- **Clear Week**: Remove all meal plans for a week
- **Repeat Meals**: Repeat specific meals across multiple days

#### Week View
- Color-coded meal types
- Recipe names and prep/cook times
- Delete individual meal plans
- Edit meal plan notes

### API Endpoints

```
GET    /api/meal-plans/                         # List meal plans
POST   /api/meal-plans/                         # Create meal plan
GET    /api/meal-plans/{id}/                    # Get meal plan
PUT    /api/meal-plans/{id}/                    # Update meal plan
DELETE /api/meal-plans/{id}/                    # Delete meal plan
GET    /api/meal-plans/week/?start_date=YYYY-MM-DD  # Get week view
POST   /api/meal-plans/bulk_operation/         # Bulk operations
```

### Database Schema

**MealPlan**:
```python
MealPlan:
  - id (PK)
  - user (FK to User)
  - recipe (FK to Recipe, nullable)
  - date (Date)
  - meal_type (Choice: breakfast, lunch, dinner)
  - order (Integer, for multiple recipes per slot)
  - notes (Text)
  - created_at
  - updated_at

  Indexes:
    - (user, date)
    - (user, date, meal_type)
    - (date, meal_type, order)
```

### Frontend Components

**MealPlanner.js**:
- Weekly calendar grid
- Week navigation
- Meal plan display
- Add/delete meal plans
- Bulk operation actions

**RecipeSelectorModal.js**:
- Recipe search and filter
- Recipe list display
- Recipe selection
- Add to meal plan action

### Implementation Details

- **Week Calculation**: Proper Sunday start, 7-day range
- **User Isolation**: Users only see their own meal plans
- **Recipe Details**: Embedded recipe information in responses
- **Bulk Operations**: Efficient database operations
- **Date Handling**: Server-side date validation

---

## Shopping List Generation

### Overview

Intelligent shopping list generation from meal plans with ingredient aggregation and unit conversion.

### Features

#### List Generation
- Generate from meal plan date range
- Auto-aggregate ingredients across recipes
- Smart unit conversion
- Categorize by grocery department
- Include all necessary quantities

#### Ingredient Aggregation
- Combine same ingredients from different recipes
- Sum quantities intelligently
- Handle different units (convert when possible)
- Track source recipes
- Preserve ingredient context

#### Unit Conversion System
- **Volume Units**: cups, tablespoons, teaspoons, quarts, gallons, ml, liters
- **Weight Units**: grams, kilograms, ounces, pounds
- **Count Units**: pieces, items, whole
- **Conversion Rules**:
  - 1 cup = 16 tablespoons = 48 teaspoons
  - 1 pound = 16 ounces = 453.592 grams
  - Smart unit selection (display largest reasonable unit)

#### Grocery Categories
- Produce
- Dairy & Eggs
- Meat & Seafood
- Bakery
- Pantry
- Canned Goods
- Frozen
- Beverages
- Condiments & Sauces
- Spices & Seasonings
- Snacks
- Other

#### Shopping List Management
- Check/uncheck items
- Add custom items
- Delete items
- Clear checked items
- Update quantities
- Add notes per item
- Progress tracking (X/Y items checked)

#### Export Options
- **Print**: Browser print dialog, formatted layout
- **CSV Export**: Downloadable spreadsheet
- **Share**: Generate shareable link (future)

### API Endpoints

```
GET    /api/shopping-lists/                     # List shopping lists
POST   /api/shopping-lists/                     # Create shopping list
GET    /api/shopping-lists/{id}/                # Get shopping list
PUT    /api/shopping-lists/{id}/                # Update shopping list
DELETE /api/shopping-lists/{id}/                # Delete shopping list
POST   /api/shopping-lists/generate/            # Generate from meal plans
POST   /api/shopping-lists/{id}/add_item/       # Add custom item
POST   /api/shopping-lists/{id}/clear_checked/  # Clear checked items

GET    /api/shopping-list-items/                # List items
POST   /api/shopping-list-items/                # Create item
GET    /api/shopping-list-items/{id}/           # Get item
PUT    /api/shopping-list-items/{id}/           # Update item
DELETE /api/shopping-list-items/{id}/           # Delete item
POST   /api/shopping-list-items/{id}/toggle_check/  # Toggle checked
```

### Database Schema

**ShoppingList**:
```python
ShoppingList:
  - id (PK)
  - user (FK to User)
  - name (String)
  - start_date (Date)
  - end_date (Date)
  - is_active (Boolean)
  - created_at
  - updated_at
```

**ShoppingListItem**:
```python
ShoppingListItem:
  - id (PK)
  - shopping_list (FK to ShoppingList)
  - ingredient_name (String)
  - quantity (Decimal)
  - unit (String)
  - category (Choice: 12 categories)
  - is_checked (Boolean)
  - is_custom (Boolean, user-added vs auto-generated)
  - source_recipes (JSON Array of recipe IDs)
  - notes (Text)
  - order (Integer, within category)

  Indexes:
    - (shopping_list, category)
    - (category, order)
```

### Utility Modules

**recipes/utils.py**:

1. **UnitConverter**:
   - `normalize_unit(unit)`: Standardize unit strings
   - `get_unit_category(unit)`: Determine volume/weight/count
   - `can_convert(from_unit, to_unit)`: Check compatibility
   - `convert(quantity, from_unit, to_unit)`: Perform conversion
   - `choose_best_unit(quantity, category)`: Optimize display

2. **IngredientParser**:
   - `parse_measurement(text)`: Extract quantity and unit
   - `extract_ingredient_name(text)`: Get base ingredient
   - Handles fractions (1/2, 1 1/2)
   - Handles decimals (1.5)
   - Handles mixed formats

3. **IngredientAggregator**:
   - `aggregate_ingredients(ingredients_list)`: Combine ingredients
   - `categorize_ingredient(name)`: Auto-categorize
   - `merge_quantities(items)`: Sum with unit conversion
   - Tracks source recipes

### Frontend Components

**ShoppingList.js**:
- Shopping list display
- Item checkboxes
- Progress indicator
- Category accordion layout
- Add custom item dialog
- Delete items
- Print button
- Export CSV button

**Ingredient Display**:
- Quantity + unit + name format
- Source recipe badges
- Custom item indicator
- Category headers
- Checked/unchecked styling

### Implementation Details

#### Aggregation Algorithm
1. Parse ingredients from all recipes in meal plan
2. Extract quantity, unit, and name from each
3. Group by normalized ingredient name
4. For each group:
   - Convert all to common unit (if possible)
   - Sum quantities
   - Track source recipes
   - Choose best display unit
5. Categorize automatically
6. Sort by category, then alphabetically

#### Unit Conversion Logic
- Maintain precision (Decimal type)
- Allow small rounding errors (< 0.001)
- Preserve original if conversion impossible
- Warn on incompatible units
- Default to "pieces" for count items

#### Performance Optimizations
- Batch database queries
- Cache conversions
- Efficient aggregation algorithm
- Minimal API calls

---

## Database Schema

### Complete Schema Diagram

```
User (Django Auth)
  ├── Recipe (author FK)
  │   ├── Ingredient
  │   ├── Favorite (user FK, recipe FK)
  │   └── MealPlan (user FK, recipe FK)
  │
  ├── MealPlan (user FK)
  │   └── Recipe (recipe FK)
  │
  └── ShoppingList (user FK)
      └── ShoppingListItem (shopping_list FK)
```

### Relationships

- **User → Recipe**: One-to-Many (author)
- **User → Favorite**: Many-to-Many (through Favorite model)
- **User → MealPlan**: One-to-Many
- **User → ShoppingList**: One-to-Many
- **Recipe → Ingredient**: One-to-Many
- **Recipe → MealPlan**: One-to-Many
- **ShoppingList → ShoppingListItem**: One-to-Many

### Indexes

Critical indexes for performance:
- `Recipe(author, is_public, created_at)`
- `MealPlan(user, date)`
- `MealPlan(user, date, meal_type)`
- `ShoppingListItem(shopping_list, category)`
- `Favorite(user, recipe)` - Unique constraint

### Data Integrity

- Cascade deletes where appropriate
- User isolation via query filters
- Required field validation
- Unique constraints on critical fields
- Proper foreign key relationships

---

## Testing

All features have comprehensive test coverage. See:
- **[TESTING.md](TESTING.md)** - Complete testing documentation
- **[TEST_RESULTS_MEAL_PLANNING.md](TEST_RESULTS_MEAL_PLANNING.md)** - Meal planning test results
- **[E2E_ENVIRONMENT_TUNING.md](E2E_ENVIRONMENT_TUNING.md)** - E2E test configuration

### Test Coverage by Feature

- **Authentication**: 40+ tests (backend + frontend)
- **Recipe Management**: 60+ tests
- **Meal Planning**: 44 backend + 30 frontend tests
- **Shopping Lists**: 12 backend + 10 frontend tests
- **Unit Conversion**: 21 comprehensive tests
- **E2E Workflows**: 6 full user journey tests

**Total**: 365+ tests across all layers

---

## Future Enhancements

### Planned Features
- Drag-and-drop meal planning
- Mobile app
- Recipe sharing and comments
- Nutrition information
- Grocery store integration
- Recipe import from URLs
- Meal plan templates

### Technical Improvements
- GraphQL API
- Real-time collaboration
- Offline support
- Image optimization
- Advanced caching
- Background job processing

---

**Last Updated**: November 2025

For detailed implementation guides for specific features, see the original feature documents:
- [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md) - Authentication details
- [MEAL_PLANNING_FEATURE.md](MEAL_PLANNING_FEATURE.md) - Meal planning details
