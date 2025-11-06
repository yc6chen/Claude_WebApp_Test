"""
Tests for Meal Plan API endpoints
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from recipes.models import Recipe, MealPlan, Ingredient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username='otheruser',
        email='other@example.com',
        password='testpass123'
    )


@pytest.fixture
def recipe(user):
    recipe = Recipe.objects.create(
        owner=user,
        name='Test Recipe',
        description='Test description',
        category='dinner',
        prep_time=15,
        cook_time=30,
        difficulty='easy'
    )
    Ingredient.objects.create(recipe=recipe, name='Chicken', measurement='2 lbs', order=0)
    Ingredient.objects.create(recipe=recipe, name='Rice', measurement='1 cup', order=1)
    return recipe


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.mark.django_db
class TestMealPlanAPI:
    """Test MealPlan CRUD operations"""

    def test_create_meal_plan(self, authenticated_client, recipe):
        """Test creating a meal plan"""
        data = {
            'recipe': recipe.id,
            'date': str(date.today()),
            'meal_type': 'dinner',
            'order': 0
        }

        response = authenticated_client.post('/api/meal-plans/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['recipe'] == recipe.id
        assert response.data['meal_type'] == 'dinner'
        assert 'recipe_details' in response.data

    def test_create_meal_plan_unauthenticated(self, api_client, recipe):
        """Test that unauthenticated users cannot create meal plans"""
        data = {
            'recipe': recipe.id,
            'date': str(date.today()),
            'meal_type': 'breakfast'
        }

        response = api_client.post('/api/meal-plans/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_meal_plans(self, authenticated_client, recipe, user):
        """Test listing meal plans"""
        # Create some meal plans
        MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='breakfast'
        )
        MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='lunch'
        )

        response = authenticated_client.get('/api/meal-plans/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_list_meal_plans_filtered_by_date(self, authenticated_client, recipe, user):
        """Test filtering meal plans by date range"""
        today = date.today()
        tomorrow = today + timedelta(days=1)

        MealPlan.objects.create(user=user, recipe=recipe, date=today, meal_type='breakfast')
        MealPlan.objects.create(user=user, recipe=recipe, date=tomorrow, meal_type='breakfast')

        response = authenticated_client.get(f'/api/meal-plans/?start_date={today}&end_date={today}')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_user_can_only_see_own_meal_plans(self, authenticated_client, recipe, user, other_user):
        """Test that users only see their own meal plans"""
        MealPlan.objects.create(user=user, recipe=recipe, date=date.today(), meal_type='breakfast')
        MealPlan.objects.create(user=other_user, recipe=recipe, date=date.today(), meal_type='lunch')

        response = authenticated_client.get('/api/meal-plans/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_update_meal_plan(self, authenticated_client, recipe, user):
        """Test updating a meal plan"""
        meal_plan = MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='breakfast'
        )

        data = {'meal_type': 'lunch', 'notes': 'Updated notes'}
        response = authenticated_client.patch(f'/api/meal-plans/{meal_plan.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['meal_type'] == 'lunch'
        assert response.data['notes'] == 'Updated notes'

    def test_delete_meal_plan(self, authenticated_client, recipe, user):
        """Test deleting a meal plan"""
        meal_plan = MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='breakfast'
        )

        response = authenticated_client.delete(f'/api/meal-plans/{meal_plan.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not MealPlan.objects.filter(id=meal_plan.id).exists()

    def test_get_week_view(self, authenticated_client, recipe, user):
        """Test getting meal plans for a week"""
        # Get a Sunday date
        today = date.today()
        days_since_sunday = (today.weekday() + 1) % 7
        sunday = today - timedelta(days=days_since_sunday)

        # Create meal plans for the week starting from Sunday
        for i in range(7):
            day = sunday + timedelta(days=i)
            MealPlan.objects.create(
                user=user,
                recipe=recipe,
                date=day,
                meal_type='breakfast'
            )

        response = authenticated_client.get(f'/api/meal-plans/week/?start_date={sunday}')

        assert response.status_code == status.HTTP_200_OK
        assert 'start_date' in response.data
        assert 'end_date' in response.data
        assert 'meal_plans' in response.data
        assert len(response.data['meal_plans']) == 7

    def test_clear_week(self, authenticated_client, recipe, user):
        """Test clearing meal plans for a week"""
        today = date.today()
        week_end = today + timedelta(days=6)

        # Create meal plans for the week
        for i in range(7):
            day = today + timedelta(days=i)
            MealPlan.objects.create(
                user=user,
                recipe=recipe,
                date=day,
                meal_type='breakfast'
            )

        data = {
            'action': 'clear',
            'start_date': str(today),
            'end_date': str(week_end)
        }

        response = authenticated_client.post('/api/meal-plans/bulk_operation/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['action'] == 'clear'
        assert response.data['deleted_count'] == 7
        assert MealPlan.objects.filter(user=user).count() == 0

    def test_copy_week(self, authenticated_client, recipe, user):
        """Test copying meal plans to another week"""
        source_start = date.today()
        source_end = source_start + timedelta(days=6)
        target_start = source_start + timedelta(days=7)

        # Create meal plans for source week
        for i in range(7):
            day = source_start + timedelta(days=i)
            MealPlan.objects.create(
                user=user,
                recipe=recipe,
                date=day,
                meal_type='breakfast'
            )

        data = {
            'action': 'copy',
            'start_date': str(source_start),
            'end_date': str(source_end),
            'target_start_date': str(target_start)
        }

        response = authenticated_client.post('/api/meal-plans/bulk_operation/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['action'] == 'copy'
        assert response.data['copied_count'] == 7
        assert MealPlan.objects.filter(user=user).count() == 14

    def test_multiple_recipes_per_meal(self, authenticated_client, recipe, user):
        """Test adding multiple recipes to the same meal slot"""
        MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='dinner',
            order=0
        )
        MealPlan.objects.create(
            user=user,
            recipe=recipe,
            date=date.today(),
            meal_type='dinner',
            order=1
        )

        response = authenticated_client.get('/api/meal-plans/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        # Verify ordering
        assert response.data[0]['order'] == 0
        assert response.data[1]['order'] == 1
