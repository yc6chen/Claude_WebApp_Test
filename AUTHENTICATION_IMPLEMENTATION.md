# Authentication System Implementation Guide

## Overview

This document describes the complete JWT-based authentication system implemented for the Recipe Management Application, including user registration, login, role-based access control, favorites, and private recipes.

## Backend Implementation

### 1. Dependencies Added

**File: `backend/requirements.txt`**
- Added `djangorestframework-simplejwt==5.3.1` for JWT authentication

### 2. Django Settings Configuration

**File: `backend/recipe_project/settings.py`**

#### Installed Apps:
```python
'rest_framework_simplejwt',
'rest_framework_simplejwt.token_blacklist',
```

#### REST Framework Configuration:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ]
}
```

#### JWT Settings:
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- Token rotation enabled with blacklisting
- Automatic user last_login update

#### Security Settings:
- HTTP-only cookies for refresh tokens
- CSRF protection configured
- Secure cookies in production
- SameSite cookie policy

### 3. Database Models

**File: `backend/recipes/models.py`**

#### Updated Recipe Model:
```python
class Recipe(models.Model):
    owner = models.ForeignKey(User, on_delete=CASCADE, null=True, blank=True)
    is_private = models.BooleanField(default=False, db_index=True)
    # ... existing fields
```

#### New UserProfile Model:
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=CASCADE)
    bio = models.TextField(blank=True, max_length=500)
    avatar = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### New Favorite Model:
```python
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    # Unique constraint: user + recipe
```

### 4. Serializers

**File: `backend/recipes/serializers.py`**

- **RegisterSerializer**: Handles user registration with password validation
- **UserSerializer**: Returns user information with profile
- **UserProfileSerializer**: Manages user profile data
- **FavoriteSerializer**: Handles recipe favorites
- **RecipeSerializer** (Updated): Includes owner info, privacy status, and favorite status

### 5. Custom Permissions

**File: `backend/recipes/permissions.py`**

- **IsOwnerOrReadOnly**: Allows read access to all, write access to owner only. Private recipes only visible to owner.
- **IsOwner**: Restricts all access to owner only

### 6. API Views

**File: `backend/recipes/views.py`**

#### Authentication Views:
- `RegisterView`: User registration with automatic token generation
- `LogoutView`: Blacklists refresh token
- `CurrentUserView`: Get/update current user info
- `UserProfileView`: Get/update user profile

#### Recipe ViewSet Updates:
- Privacy filtering in `get_queryset()` (public recipes for all, private for owner only)
- `my_recipes()` action: Get user's own recipes
- `favorites()` action: Get favorited recipes
- `favorite()` action: Add recipe to favorites
- `unfavorite()` action: Remove from favorites

### 7. URL Configuration

**File: `backend/recipes/urls.py`**

#### Authentication Endpoints:
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login (get tokens)
- `POST /api/auth/logout/` - Logout (blacklist token)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET/PATCH /api/auth/user/` - Current user info
- `GET/PATCH /api/auth/profile/` - User profile

#### Recipe Endpoints (Updated):
- `GET /api/recipes/` - List recipes (with privacy filtering)
- `POST /api/recipes/` - Create recipe (authenticated)
- `GET /api/recipes/{id}/` - Get recipe details
- `PUT/PATCH /api/recipes/{id}/` - Update recipe (owner only)
- `DELETE /api/recipes/{id}/` - Delete recipe (owner only)
- `GET /api/recipes/my_recipes/` - User's own recipes
- `GET /api/recipes/favorites/` - User's favorited recipes
- `POST /api/recipes/{id}/favorite/` - Favorite recipe
- `DELETE /api/recipes/{id}/unfavorite/` - Unfavorite recipe

#### Favorites Endpoints:
- `GET /api/favorites/` - List user's favorites
- `POST /api/favorites/` - Create favorite
- `DELETE /api/favorites/{id}/` - Delete favorite

### 8. Admin Interface

**File: `backend/recipes/admin.py`**

Registered new models:
- UserProfile
- Favorite

Updated Recipe admin to show owner and privacy status.

## Frontend Implementation

### 1. Dependencies Added

**File: `frontend/package.json`**
- Added `react-router-dom` for routing

### 2. Authentication Utilities

**File: `frontend/src/utils/auth.js`**

Functions for managing authentication state:
- `setAuthTokens()` - Store tokens and user info
- `getAccessToken()` - Retrieve access token
- `getRefreshToken()` - Retrieve refresh token
- `getUser()` - Get stored user info
- `clearAuthTokens()` - Clear all auth data
- `isAuthenticated()` - Check auth status
- `parseJwt()` - Decode JWT token
- `isTokenExpired()` - Check if token expired
- `shouldRefreshToken()` - Check if token needs refresh

### 3. API Service Layer

**File: `frontend/src/services/api.js`**

Centralized API service with:
- Automatic token refresh
- Request queuing during token refresh
- Authentication interceptors
- All API endpoints wrapped with authentication

Key methods:
- `login()`, `register()`, `logout()`
- `getCurrentUser()`
- `getRecipes()`, `createRecipe()`, `updateRecipe()`, `deleteRecipe()`
- `getMyRecipes()`, `getFavoriteRecipes()`
- `favoriteRecipe()`, `unfavoriteRecipe()`

### 4. Authentication Context

**File: `frontend/src/contexts/AuthContext.js`**

React Context providing:
- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `loading` - Loading state
- `login()` - Login function
- `register()` - Registration function
- `logout()` - Logout function

### 5. UI Components

#### Login Component
**File: `frontend/src/components/Login.js`**
- Material-UI form with username/password
- Password visibility toggle
- Error handling
- Link to registration

#### Register Component
**File: `frontend/src/components/Register.js`**
- Material-UI form with all user fields
- Password confirmation
- Client-side validation
- Server error display
- Link to login

#### Protected Route Component
**File: `frontend/src/components/ProtectedRoute.js`**
- Route wrapper requiring authentication
- Redirects to login if not authenticated
- Shows loading state during auth check

#### My Recipes Component
**File: `frontend/src/components/MyRecipes.js`**
- Tabbed interface (My Recipes / Favorites)
- Recipe cards with edit/delete actions
- Favorite/unfavorite functionality
- Empty states with helpful messages

#### Updated RecipeDetail Component
**File: `frontend/src/components/RecipeDetail.js`**
- Favorite/unfavorite button
- Owner information display
- Privacy status indicator (lock/public icon)
- Delete button only for owners
- Favorites count display

#### Updated AddRecipeModal Component
**File: `frontend/src/components/AddRecipeModal.js`**
- Privacy toggle switch (Private/Public)
- Visual indicators (lock/public icons)
- Persists privacy setting in form state

### 6. Main Application

**File: `frontend/src/App.js`**

Integrated routing with:
- Route protection
- Navigation bar with user menu
- Login/Register routes
- My Recipes route
- Home route with recipe browser

Routes:
- `/` - Home (recipe list and details)
- `/login` - Login page
- `/register` - Registration page
- `/my-recipes` - User's recipes and favorites (protected)

## Security Features Implemented

### 1. Password Security
- Django's built-in password hashing (PBKDF2)
- Password validation (minimum length, common passwords, etc.)
- Password confirmation on registration

### 2. JWT Token Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Token rotation on refresh
- Token blacklisting on logout
- Automatic token refresh before expiration

### 3. Authorization
- Role-based access control via custom permissions
- Owner-only edit/delete for recipes
- Privacy control for recipes
- Authenticated-only recipe creation

### 4. HTTP Security
- CORS configuration for allowed origins
- CSRF protection enabled
- Secure cookies in production
- HTTP-only cookies for sensitive data
- SameSite cookie policy

### 5. API Security
- Authentication required for write operations
- Privacy filtering at database level
- Owner validation before updates
- Input validation via serializers

## Database Migrations

The following migrations need to be created and applied:

```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate
```

Expected migrations:
1. Add `owner` and `is_private` fields to Recipe model
2. Create UserProfile model
3. Create Favorite model
4. Add indexes for owner and privacy queries

## Testing the System

### 1. Start the Application

```bash
docker-compose up --build
```

### 2. Create Migrations and Apply

```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### 3. Create Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Test Authentication Flow

1. **Register a new user**:
   - Navigate to http://localhost:3000/register
   - Fill in registration form
   - Verify automatic login after registration

2. **Login**:
   - Navigate to http://localhost:3000/login
   - Login with credentials
   - Verify redirect to home page

3. **Create a private recipe**:
   - Click the + button
   - Fill in recipe details
   - Toggle "Private" switch
   - Submit and verify

4. **Create a public recipe**:
   - Create another recipe with "Public" toggle
   - Logout and verify public recipe is visible
   - Verify private recipe is hidden

5. **Favorite recipes**:
   - Click heart icon on recipes
   - Navigate to "My Recipes" tab
   - Verify favorites appear in "Favorites" tab

6. **Test My Recipes**:
   - Click user menu → "My Recipes"
   - Verify "My Recipes" tab shows your recipes
   - Edit and delete your recipes
   - Verify privacy indicators

7. **Test token refresh**:
   - Stay logged in for > 15 minutes
   - Make an API request
   - Verify automatic token refresh

8. **Logout**:
   - Click user menu → "Logout"
   - Verify redirect to login
   - Verify token is blacklisted

### 5. Test API Endpoints (using curl or Postman)

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!","password2":"TestPass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123!"}'

# Get recipes (use access token from login)
curl -X GET http://localhost:8000/api/recipes/ \
  -H "Authorization: Bearer <access_token>"

# Create private recipe
curl -X POST http://localhost:8000/api/recipes/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Secret Recipe","description":"Top secret","prep_time":30,"cook_time":45,"is_private":true,"ingredients":[]}'

# Favorite a recipe
curl -X POST http://localhost:8000/api/recipes/1/favorite/ \
  -H "Authorization: Bearer <access_token>"

# Get my recipes
curl -X GET http://localhost:8000/api/recipes/my_recipes/ \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'

# Logout
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
```

## Features Summary

### User Management
✅ User registration with email and password validation
✅ Secure login with JWT tokens
✅ User profile management
✅ Secure logout with token blacklisting

### Recipe Management
✅ Public/private recipe toggle
✅ Owner-only edit and delete
✅ Recipe ownership tracking
✅ My Recipes view

### Favorites System
✅ Favorite/unfavorite recipes
✅ Favorites count on recipes
✅ My Favorites view
✅ Favorite status indicators

### Security
✅ JWT-based authentication
✅ Automatic token refresh
✅ Password hashing
✅ Role-based access control
✅ CSRF protection
✅ Secure HTTP-only cookies
✅ Privacy filtering

### User Experience
✅ Responsive Material-UI design
✅ Protected routes
✅ Loading states
✅ Error handling
✅ User feedback
✅ Intuitive navigation

## Troubleshooting

### Issue: Migrations won't apply
**Solution**: Ensure database is running and accessible
```bash
docker-compose ps  # Check service status
docker-compose logs db  # Check database logs
```

### Issue: Token refresh fails
**Solution**: Check JWT settings in settings.py and verify token_blacklist app is installed

### Issue: CORS errors
**Solution**: Verify frontend URL in CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS

### Issue: Private recipes visible to others
**Solution**: Check permissions.py and verify get_queryset filtering in views.py

### Issue: Can't login after registration
**Solution**: Check that UserProfile is created in RegisterSerializer.create()

## Next Steps / Enhancements

Potential future improvements:
1. Email verification for registration
2. Password reset functionality
3. Social authentication (Google, Facebook)
4. User avatar upload
5. Admin role with additional permissions
6. Recipe sharing with specific users
7. Recipe comments and ratings
8. Activity feed
9. Recipe collections/cookbooks
10. Advanced search with Elasticsearch

## Files Modified/Created

### Backend Files:
- `backend/requirements.txt` - Added JWT dependency
- `backend/recipe_project/settings.py` - JWT and security configuration
- `backend/recipes/models.py` - Added UserProfile, Favorite, updated Recipe
- `backend/recipes/serializers.py` - Added auth serializers
- `backend/recipes/permissions.py` - NEW: Custom permissions
- `backend/recipes/views.py` - Added auth views, updated RecipeViewSet
- `backend/recipes/urls.py` - Added auth routes
- `backend/recipes/admin.py` - Registered new models

### Frontend Files:
- `frontend/package.json` - Added react-router-dom
- `frontend/src/utils/auth.js` - NEW: Auth utilities
- `frontend/src/services/api.js` - NEW: API service layer
- `frontend/src/contexts/AuthContext.js` - NEW: Auth context
- `frontend/src/components/Login.js` - NEW: Login component
- `frontend/src/components/Register.js` - NEW: Register component
- `frontend/src/components/ProtectedRoute.js` - NEW: Route guard
- `frontend/src/components/MyRecipes.js` - NEW: User recipes view
- `frontend/src/components/RecipeDetail.js` - Updated with favorites
- `frontend/src/components/AddRecipeModal.js` - Added privacy toggle
- `frontend/src/App.js` - Complete rewrite with routing

## API Documentation

Full API documentation available at:
- Development: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

## Conclusion

The authentication system is now fully implemented with comprehensive security features, user management, and role-based access control. The system follows best practices for JWT authentication and provides a solid foundation for future enhancements.
