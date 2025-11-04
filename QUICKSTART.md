# Quick Start Guide - Authentication System

## Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 8000, and 5432 available

## Step-by-Step Setup

### 1. Build and Start Services

```bash
# Build all services (this will install new dependencies)
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 2. Create Database Migrations

```bash
# Create migrations for new models
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate
```

### 3. Create a Superuser (Optional)

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

## Testing the Authentication System

### 1. Register a New User

1. Navigate to http://localhost:3000
2. Click "Sign Up" in the top right
3. Fill in the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. Click "Sign Up"
5. You should be automatically logged in and redirected to home

### 2. Create a Recipe

1. Click the blue **+** button in the bottom right
2. Fill in recipe details:
   - Name: "Test Recipe"
   - Description: "This is a test"
   - Category: Select any
   - Prep Time: 15
   - Cook Time: 30
   - Difficulty: Easy
3. Toggle "Private" if you want only you to see it
4. Add ingredients (optional)
5. Click "Add Recipe"

### 3. Test Favorites

1. Browse the recipe list on the left
2. Select a recipe to view details
3. Click the **heart icon** in the top right of the recipe detail panel
4. The recipe is now in your favorites

### 4. View Your Recipes

1. Click your **profile icon** in the top right
2. Select "My Recipes"
3. You'll see two tabs:
   - **My Recipes**: Recipes you've created
   - **Favorites**: Recipes you've favorited
4. Edit or delete your own recipes

### 5. Test Privacy

1. Create a **private recipe** (toggle "Private" when creating)
2. Create a **public recipe** (leave "Private" off)
3. Logout (click profile icon → Logout)
4. Browse recipes while logged out
5. You should see the public recipe but NOT the private one
6. Login again to see your private recipes

### 6. Test Logout

1. Click the profile icon in the top right
2. Select "Logout"
3. You should be redirected to the login page
4. Your authentication token is now blacklisted

## API Endpoints Reference

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register/` | POST | Register new user | No |
| `/api/auth/login/` | POST | Login and get tokens | No |
| `/api/auth/logout/` | POST | Logout and blacklist token | Yes |
| `/api/auth/token/refresh/` | POST | Refresh access token | No |
| `/api/auth/user/` | GET, PATCH | Get/update current user | Yes |
| `/api/auth/profile/` | GET, PATCH | Get/update user profile | Yes |

### Recipes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/recipes/` | GET | List recipes (public + own private) | No* |
| `/api/recipes/` | POST | Create recipe | Yes |
| `/api/recipes/{id}/` | GET | Get recipe details | No* |
| `/api/recipes/{id}/` | PUT, PATCH | Update recipe | Yes (owner) |
| `/api/recipes/{id}/` | DELETE | Delete recipe | Yes (owner) |
| `/api/recipes/my_recipes/` | GET | Get user's recipes | Yes |
| `/api/recipes/favorites/` | GET | Get favorited recipes | Yes |
| `/api/recipes/{id}/favorite/` | POST | Favorite a recipe | Yes |
| `/api/recipes/{id}/unfavorite/` | DELETE | Unfavorite a recipe | Yes |

*Public recipes visible without auth, private recipes require owner authentication

### Favorites

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/favorites/` | GET | List user's favorites | Yes |
| `/api/favorites/` | POST | Create favorite | Yes |
| `/api/favorites/{id}/` | DELETE | Remove favorite | Yes |

## Example API Calls

### Register User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Create Private Recipe

```bash
curl -X POST http://localhost:8000/api/recipes/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Secret Family Recipe",
    "description": "This is top secret!",
    "category": "dinner",
    "prep_time": 30,
    "cook_time": 60,
    "difficulty": "medium",
    "is_private": true,
    "dietary_tags": ["gluten_free"],
    "ingredients": [
      {"name": "Chicken", "measurement": "2 lbs", "order": 0},
      {"name": "Garlic", "measurement": "4 cloves", "order": 1}
    ]
  }'
```

### Get My Recipes

```bash
curl -X GET http://localhost:8000/api/recipes/my_recipes/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Favorite a Recipe

```bash
curl -X POST http://localhost:8000/api/recipes/5/favorite/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Stopping the Application

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

## Troubleshooting

### Issue: "django-insecure" warnings
**Solution**: This is normal for development. In production, set a secure SECRET_KEY environment variable.

### Issue: Port already in use
**Solution**: Change ports in docker-compose.yml or stop conflicting services.

### Issue: Frontend can't connect to backend
**Solution**:
1. Check backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify CORS settings in `backend/recipe_project/settings.py`

### Issue: Migrations not applied
**Solution**: Run migrations manually:
```bash
docker-compose exec backend python manage.py migrate
```

### Issue: Can't create recipes (401 Unauthorized)
**Solution**: You need to be logged in. Check that:
1. You're logged in (profile icon should show in top right)
2. Token is valid (try logging out and back in)
3. Check browser console for errors

### Issue: Private recipes visible to everyone
**Solution**:
1. Check that migrations were applied
2. Verify `is_private` field exists in database
3. Check that you're setting `is_private: true` when creating

## Development Tips

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Run Django Commands

```bash
# Django shell
docker-compose exec backend python manage.py shell

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run tests
docker-compose exec backend pytest

# Check migrations
docker-compose exec backend python manage.py showmigrations
```

### Frontend Development

```bash
# Install new npm package
docker-compose exec frontend npm install PACKAGE_NAME

# Run tests
docker-compose exec frontend npm test

# Build for production
docker-compose exec frontend npm run build
```

### Database Access

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres recipedb

# View tables
\dt

# View recipes
SELECT id, name, owner_id, is_private FROM recipes_recipe;

# View users
SELECT id, username, email FROM auth_user;
```

## Security Notes

### Development vs Production

This setup is configured for DEVELOPMENT. For production:

1. **Set secure SECRET_KEY**: Use environment variable, not hardcoded
2. **DEBUG = False**: Disable debug mode
3. **HTTPS**: Use HTTPS for all traffic
4. **Secure cookies**: Already configured to enable in production
5. **ALLOWED_HOSTS**: Restrict to your domain
6. **CORS**: Restrict to your frontend domain
7. **Database**: Use production-grade database credentials
8. **Environment variables**: Use .env file or secrets management

### Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are automatically refreshed before expiration
- Logout blacklists the refresh token
- Tokens are stored in localStorage (consider httpOnly cookies for enhanced security)

## What's Next?

You now have a fully functional authentication system! Next steps:

1. ✅ Test all features thoroughly
2. ✅ Create some test data
3. ✅ Explore the API with Postman or curl
4. ✅ Customize the UI to match your brand
5. ✅ Add more features (comments, ratings, etc.)
6. ✅ Deploy to production

Enjoy your new authenticated recipe app! 🎉
