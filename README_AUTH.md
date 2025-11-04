# Recipe Management Application with Authentication

A full-stack web application for managing recipes with secure JWT-based authentication, user accounts, favorites, and privacy controls.

## 🌟 Features

### Core Features
- 📝 Create, read, update, and delete recipes
- 🔍 Advanced search and filtering
- 🏷️ Category organization
- ⏱️ Prep and cook time tracking
- 📊 Difficulty ratings
- 🥗 Dietary tag system (10+ tags)
- 📱 Responsive Material Design UI

### Authentication & User Features
- 🔐 Secure JWT-based authentication
- 👤 User registration and login
- 🔄 Automatic token refresh
- 🚪 Secure logout with token blacklisting
- 👥 User profiles
- 📚 My Recipes view
- ⭐ Favorites system
- 🔒 Public/private recipe control
- 👑 Owner-only edit/delete permissions

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2
- **API**: Django REST Framework 3.14
- **Authentication**: djangorestframework-simplejwt 5.3
- **Database**: PostgreSQL 15
- **Testing**: pytest, pytest-django

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI v5
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: Emotion (CSS-in-JS)

### DevOps
- **Containerization**: Docker & Docker Compose
- **E2E Testing**: Playwright
- **Development**: Hot reload for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TestWebApp
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Create database migrations**
   ```bash
   docker-compose exec backend python manage.py makemigrations
   docker-compose exec backend python manage.py migrate
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/

### First Steps

1. **Register an account**
   - Click "Sign Up" in the top right
   - Fill in your details
   - You'll be automatically logged in

2. **Create your first recipe**
   - Click the blue **+** button
   - Fill in recipe details
   - Toggle "Private" if you want only you to see it
   - Click "Add Recipe"

3. **Explore features**
   - Favorite recipes by clicking the heart icon
   - View "My Recipes" from the user menu
   - Search and filter recipes
   - Toggle privacy settings

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Step-by-step setup and testing
- **[Implementation Guide](AUTHENTICATION_IMPLEMENTATION.md)** - Complete technical documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Overview of changes

## 🔒 Security Features

- ✅ JWT access tokens (15-minute lifetime)
- ✅ JWT refresh tokens (7-day lifetime)
- ✅ Automatic token rotation
- ✅ Token blacklisting on logout
- ✅ Password hashing (PBKDF2)
- ✅ CORS protection
- ✅ CSRF protection
- ✅ Secure HTTP-only cookies
- ✅ Role-based access control
- ✅ Privacy filtering at database level

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register/        - Register new user
POST   /api/auth/login/           - Login and get tokens
POST   /api/auth/logout/          - Logout and blacklist token
POST   /api/auth/token/refresh/   - Refresh access token
GET    /api/auth/user/            - Get current user
PATCH  /api/auth/user/            - Update current user
```

### Recipes
```
GET    /api/recipes/                  - List recipes
POST   /api/recipes/                  - Create recipe (auth required)
GET    /api/recipes/{id}/             - Get recipe
PUT    /api/recipes/{id}/             - Update recipe (owner only)
DELETE /api/recipes/{id}/             - Delete recipe (owner only)
GET    /api/recipes/my_recipes/       - User's recipes (auth required)
GET    /api/recipes/favorites/        - Favorited recipes (auth required)
POST   /api/recipes/{id}/favorite/    - Favorite recipe (auth required)
DELETE /api/recipes/{id}/unfavorite/  - Unfavorite recipe (auth required)
```

### Search & Filter Parameters
```
?search=keyword              - Search by name
?difficulty=easy|medium|hard - Filter by difficulty
?max_prep_time=30            - Maximum prep time
?max_cook_time=45            - Maximum cook time
?include_ingredients=x,y     - Must include ingredients
?exclude_ingredients=x,y     - Must exclude ingredients
?dietary_tags=vegan,keto     - Must have dietary tags
```

## 🧪 Testing

### Backend Tests (124 tests, 98.7% coverage)
```bash
docker-compose exec backend pytest
docker-compose exec backend pytest --cov
```

### Frontend Tests (160+ tests, 78.7% coverage)
```bash
docker-compose exec frontend npm test
```

### E2E Tests (29 tests)
```bash
docker-compose --profile e2e up
```

## 🏗️ Project Structure

```
TestWebApp/
├── backend/
│   ├── recipe_project/         # Django project settings
│   │   └── settings.py         # JWT & security config
│   ├── recipes/                # Main app
│   │   ├── models.py           # Recipe, UserProfile, Favorite
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # API views
│   │   ├── permissions.py      # Custom permissions
│   │   ├── urls.py             # API routes
│   │   └── tests/              # Test suite
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration page
│   │   │   ├── MyRecipes.js    # User recipes view
│   │   │   ├── RecipeList.js   # Recipe browser
│   │   │   └── RecipeDetail.js # Recipe details
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Authentication context
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── utils/
│   │   │   └── auth.js         # Auth utilities
│   │   └── App.js              # Main app with routing
│   ├── package.json            # npm dependencies
│   └── Dockerfile              # Frontend container
├── e2e/                        # Playwright tests
├── docker-compose.yml          # Docker orchestration
└── README.md                   # This file
```

## 📊 Database Schema

### User Models
- **User** (Django built-in)
- **UserProfile**: Extended user information
  - bio, avatar, timestamps

### Recipe Models
- **Recipe**: Core recipe information
  - owner, is_private, name, description
  - category, difficulty, timing
  - dietary_tags, timestamps

- **Ingredient**: Recipe ingredients
  - recipe, name, measurement, order

- **Favorite**: User favorites
  - user, recipe, created_at

## 🎨 UI Components

### Pages
- **Home** (`/`) - Recipe browser with search and filters
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration
- **My Recipes** (`/my-recipes`) - User's recipes and favorites (protected)

### Features
- **Navigation Bar** - User menu, login/logout
- **Recipe Browser** - Two-pane layout (list + details)
- **Search & Filters** - Real-time search with advanced filters
- **Recipe Cards** - Category-organized recipe list
- **Recipe Details** - Full recipe view with ingredients
- **Add Recipe Modal** - Form to create recipes
- **Privacy Toggle** - Public/private control
- **Favorites** - Heart icon to favorite recipes
- **Protected Routes** - Auth-required pages

## 🔧 Configuration

### Environment Variables

**Backend**
```bash
SECRET_KEY=your-secret-key-here          # Django secret key
DEBUG=True                               # Debug mode
ALLOWED_HOSTS=*                          # Allowed hosts
POSTGRES_DB=recipedb                     # Database name
POSTGRES_USER=postgres                   # Database user
POSTGRES_PASSWORD=postgres               # Database password
DB_HOST=db                               # Database host
DB_PORT=5432                             # Database port
```

**Frontend**
```bash
REACT_APP_API_URL=http://localhost:8000/api  # API base URL
```

### JWT Settings
```python
ACCESS_TOKEN_LIFETIME = 15 minutes   # Access token expiry
REFRESH_TOKEN_LIFETIME = 7 days      # Refresh token expiry
ROTATE_REFRESH_TOKENS = True         # Rotate on refresh
BLACKLIST_AFTER_ROTATION = True      # Blacklist old tokens
```

## 🚧 Development

### Backend Development
```bash
# Run Django shell
docker-compose exec backend python manage.py shell

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run migrations
docker-compose exec backend python manage.py migrate

# Run tests
docker-compose exec backend pytest -v
```

### Frontend Development
```bash
# Install package
docker-compose exec frontend npm install package-name

# Run tests
docker-compose exec frontend npm test

# Build for production
docker-compose exec frontend npm run build
```

### Database Access
```bash
# PostgreSQL shell
docker-compose exec db psql -U postgres recipedb

# View tables
\dt

# View recipes
SELECT * FROM recipes_recipe;

# View users
SELECT * FROM auth_user;
```

## 📈 Performance

### Backend
- Database indexes on common query fields
- Composite indexes for common query patterns
- Efficient QuerySet filtering
- Select/prefetch related for N+1 prevention

### Frontend
- React.memo for expensive components
- Lazy loading for routes
- Debounced search input
- Optimized re-renders with proper state management

## 🔐 Security Best Practices

### Development
- ✅ CORS restricted to localhost
- ✅ Debug mode enabled
- ✅ Insecure secret key (for dev only)
- ✅ Local database

### Production (Recommendations)
- ❗ Set secure SECRET_KEY
- ❗ DEBUG = False
- ❗ HTTPS only
- ❗ Secure cookies enabled
- ❗ ALLOWED_HOSTS restricted
- ❗ CORS restricted to production domain
- ❗ Strong database credentials
- ❗ Environment variable management

## 🐛 Troubleshooting

### Common Issues

**Issue: Migrations won't apply**
```bash
# Check database status
docker-compose ps

# View logs
docker-compose logs db

# Force recreation
docker-compose down -v
docker-compose up --build
```

**Issue: Frontend can't connect to backend**
```bash
# Check backend is running
docker-compose ps backend

# Check CORS settings
# Verify CORS_ALLOWED_ORIGINS in settings.py
```

**Issue: 401 Unauthorized**
```bash
# Check you're logged in
# Clear localStorage and login again
# Check token hasn't expired
```

**Issue: Private recipes visible**
```bash
# Check migrations applied
docker-compose exec backend python manage.py showmigrations

# Verify is_private field exists
docker-compose exec db psql -U postgres recipedb -c "\d recipes_recipe"
```

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Contributors Here]

## 🙏 Acknowledgments

- Django REST Framework team
- Simple JWT team
- Material-UI team
- React Router team

## 📞 Support

For issues and questions:
- Check [QUICKSTART.md](QUICKSTART.md)
- Check [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md)
- Open an issue on GitHub

---

**Built with ❤️ using Django, React, and Docker**
