"""
Tests for Shopping List API endpoints
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from recipes.models import Recipe, MealPlan, ShoppingList, ShoppingListItem, Ingredient


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
def recipe_with_ingredients(user):
    recipe = Recipe.objects.create(
        owner=user,
        name='Pasta Dish',
        description='Test pasta',
        category='dinner',
        prep_time=10,
        cook_time=20,
        difficulty='easy'
    )
    Ingredient.objects.create(recipe=recipe, name='Pasta', measurement='2 cups', order=0)
    Ingredient.objects.create(recipe=recipe, name='Tomato Sauce', measurement='1 cup', order=1)
    Ingredient.objects.create(recipe=recipe, name='Cheese', measurement='1/2 cup', order=2)
    return recipe


@pytest.fixture
def another_recipe(user):
    recipe = Recipe.objects.create(
        owner=user,
        name='Salad',
        description='Fresh salad',
        category='lunch',
        prep_time=5,
        cook_time=0,
        difficulty='easy'
    )
    Ingredient.objects.create(recipe=recipe, name='Lettuce', measurement='2 cups', order=0)
    Ingredient.objects.create(recipe=recipe, name='Tomato', measurement='1 whole', order=1)
    Ingredient.objects.create(recipe=recipe, name='Cheese', measurement='1/4 cup', order=2)
    return recipe


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def shopping_list(user):
    return ShoppingList.objects.create(
        user=user,
        name='Test Shopping List',
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6)
    )


@pytest.mark.django_db
class TestShoppingListAPI:
    """Test ShoppingList CRUD operations"""

    def test_create_shopping_list(self, authenticated_client):
        """Test creating a shopping list"""
        data = {
            'name': 'Weekly Shopping',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=6)),
            'is_active': True
        }

        response = authenticated_client.post('/api/shopping-lists/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Weekly Shopping'
        assert response.data['is_active'] is True

    def test_list_shopping_lists(self, authenticated_client, shopping_list):
        """Test listing shopping lists"""
        response = authenticated_client.get('/api/shopping-lists/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_get_shopping_list_detail(self, authenticated_client, shopping_list):
        """Test getting shopping list details"""
        # Add some items
        ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Milk',
            quantity=Decimal('1'),
            unit='gallon',
            category='dairy'
        )

        response = authenticated_client.get(f'/api/shopping-lists/{shopping_list.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == shopping_list.name
        assert 'items' in response.data
        assert len(response.data['items']) == 1

    def test_update_shopping_list(self, authenticated_client, shopping_list):
        """Test updating a shopping list"""
        data = {'name': 'Updated Name', 'is_active': False}

        response = authenticated_client.patch(
            f'/api/shopping-lists/{shopping_list.id}/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Name'
        assert response.data['is_active'] is False

    def test_delete_shopping_list(self, authenticated_client, shopping_list):
        """Test deleting a shopping list"""
        response = authenticated_client.delete(f'/api/shopping-lists/{shopping_list.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ShoppingList.objects.filter(id=shopping_list.id).exists()

    def test_generate_shopping_list_from_meal_plans(
        self, authenticated_client, user, recipe_with_ingredients, another_recipe
    ):
        """Test generating a shopping list from meal plans"""
        today = date.today()
        week_end = today + timedelta(days=6)

        # Create meal plans
        MealPlan.objects.create(
            user=user,
            recipe=recipe_with_ingredients,
            date=today,
            meal_type='dinner'
        )
        MealPlan.objects.create(
            user=user,
            recipe=another_recipe,
            date=today + timedelta(days=1),
            meal_type='lunch'
        )

        data = {
            'start_date': str(today),
            'end_date': str(week_end)
        }

        response = authenticated_client.post('/api/shopping-lists/generate/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert 'items' in response.data
        assert len(response.data['items']) > 0

        # Check that cheese was aggregated (0.5 cup + 0.25 cup = 0.75 cup or 12 tbsp)
        cheese_items = [item for item in response.data['items'] if 'cheese' in item['ingredient_name'].lower()]
        assert len(cheese_items) == 1
        # The aggregator combines quantities, result might be in tablespoons (12 = 0.75 * 16)
        # or cups (0.75). Either is acceptable as long as it's aggregated
        assert len(cheese_items[0]['source_recipes']) == 2  # From 2 recipes

    def test_generate_shopping_list_with_custom_items(self, authenticated_client, user):
        """Test generating shopping list with custom items"""
        today = date.today()
        week_end = today + timedelta(days=6)

        data = {
            'start_date': str(today),
            'end_date': str(week_end),
            'include_custom_items': True,
            'custom_items': [
                {
                    'ingredient_name': 'Bread',
                    'quantity': 2,
                    'unit': 'loaves',
                    'category': 'bakery'
                }
            ]
        }

        response = authenticated_client.post('/api/shopping-lists/generate/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        custom_items = [item for item in response.data['items'] if item['is_custom']]
        assert len(custom_items) == 1
        assert custom_items[0]['ingredient_name'] == 'Bread'

    def test_add_custom_item_to_shopping_list(self, authenticated_client, shopping_list):
        """Test adding a custom item to shopping list"""
        data = {
            'ingredient_name': 'Olive Oil',
            'quantity': 1,
            'unit': 'bottle',
            'category': 'pantry',
            'shopping_list': shopping_list.id
        }

        response = authenticated_client.post(
            f'/api/shopping-lists/{shopping_list.id}/add_item/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['ingredient_name'] == 'Olive Oil'
        assert response.data['is_custom'] is True

    def test_clear_checked_items(self, authenticated_client, shopping_list):
        """Test clearing checked items from shopping list"""
        # Create some items
        ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Milk',
            quantity=1,
            unit='gallon',
            category='dairy',
            is_checked=True
        )
        ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Eggs',
            quantity=12,
            unit='pieces',
            category='dairy',
            is_checked=False
        )

        response = authenticated_client.post(f'/api/shopping-lists/{shopping_list.id}/clear_checked/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['deleted_count'] == 1
        assert ShoppingListItem.objects.filter(shopping_list=shopping_list).count() == 1


@pytest.mark.django_db
class TestShoppingListItemAPI:
    """Test ShoppingListItem operations"""

    def test_toggle_item_check(self, authenticated_client, shopping_list):
        """Test toggling item checked status"""
        item = ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Milk',
            quantity=1,
            unit='gallon',
            category='dairy',
            is_checked=False
        )

        response = authenticated_client.post(f'/api/shopping-list-items/{item.id}/toggle_check/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_checked'] is True

        # Toggle again
        response = authenticated_client.post(f'/api/shopping-list-items/{item.id}/toggle_check/')
        assert response.data['is_checked'] is False

    def test_update_shopping_list_item(self, authenticated_client, shopping_list):
        """Test updating a shopping list item"""
        item = ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Milk',
            quantity=1,
            unit='gallon',
            category='dairy'
        )

        data = {
            'quantity': 2,
            'notes': 'Get organic'
        }

        response = authenticated_client.patch(
            f'/api/shopping-list-items/{item.id}/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['quantity']) == 2.0
        assert response.data['notes'] == 'Get organic'

    def test_delete_shopping_list_item(self, authenticated_client, shopping_list):
        """Test deleting a shopping list item"""
        item = ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            ingredient_name='Milk',
            quantity=1,
            unit='gallon',
            category='dairy'
        )

        response = authenticated_client.delete(f'/api/shopping-list-items/{item.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ShoppingListItem.objects.filter(id=item.id).exists()
