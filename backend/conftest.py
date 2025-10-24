"""
Pytest configuration and fixtures for the recipe application tests.

This module provides reusable fixtures following pytest best practices:
- Factory fixtures for flexible test data creation
- Proper fixture scoping for performance
- Composition of fixtures for complex scenarios
"""
import pytest
from rest_framework.test import APIClient
from recipes.models import Recipe, Ingredient


# ============================================================================
# API Client Fixtures
# ============================================================================

@pytest.fixture
def api_client():
    """
    Fixture to provide a DRF API client for testing API endpoints.

    Scope: function (default) - new client for each test for isolation.
    """
    return APIClient()


# ============================================================================
# Recipe Data Fixtures (Factories)
# ============================================================================

@pytest.fixture
def recipe_data_factory():
    """
    Factory fixture for creating recipe data dictionaries.

    Returns a callable that can create customized recipe data.
    This is more flexible than a static fixture.

    Usage:
        def test_example(recipe_data_factory):
            data = recipe_data_factory(name='Custom Recipe', prep_time=20)
    """
    def _create_recipe_data(**kwargs):
        """Create recipe data with defaults that can be overridden."""
        defaults = {
            'name': 'Chocolate Chip Cookies',
            'description': 'Classic homemade chocolate chip cookies',
            'category': 'desserts',
            'prep_time': 15,
            'cook_time': 12,
            'difficulty': 'easy',
        }
        defaults.update(kwargs)
        return defaults
    return _create_recipe_data


@pytest.fixture
def sample_recipe_data(recipe_data_factory):
    """
    Convenience fixture for default recipe data.

    For most tests, use this. For customization, use recipe_data_factory.
    """
    return recipe_data_factory()


@pytest.fixture
def ingredient_data_factory():
    """
    Factory fixture for creating ingredient data.

    Returns a callable that creates ingredient data lists.

    Usage:
        def test_example(ingredient_data_factory):
            ingredients = ingredient_data_factory(count=3)
    """
    def _create_ingredient_data(count=4, **kwargs):
        """Create a list of ingredient data dictionaries."""
        ingredients = [
            {'name': 'All-purpose flour', 'measurement': '2 cups', 'order': 1},
            {'name': 'Butter', 'measurement': '1 cup', 'order': 2},
            {'name': 'Sugar', 'measurement': '3/4 cup', 'order': 3},
            {'name': 'Chocolate chips', 'measurement': '2 cups', 'order': 4},
        ]
        return ingredients[:count]
    return _create_ingredient_data


@pytest.fixture
def sample_ingredient_data(ingredient_data_factory):
    """
    Convenience fixture for default ingredient data.
    """
    return ingredient_data_factory()


@pytest.fixture
def sample_recipe_with_ingredients_data(sample_recipe_data, sample_ingredient_data):
    """
    Fixture to provide complete recipe data with nested ingredients.

    Composes recipe and ingredient fixtures for complex test scenarios.
    """
    data = sample_recipe_data.copy()
    data['ingredients'] = sample_ingredient_data
    return data


# ============================================================================
# Model Instance Fixtures (Factories)
# ============================================================================

@pytest.fixture
def recipe_factory(db):
    """
    Factory fixture for creating Recipe model instances.

    This is more efficient than creating recipes in each test.
    Uses pytest's db fixture for automatic database access.

    Usage:
        def test_example(recipe_factory):
            recipe = recipe_factory(name='Test Recipe')
    """
    def _create_recipe(**kwargs):
        """Create a Recipe instance with sensible defaults."""
        defaults = {
            'name': 'Test Recipe',
            'description': 'Test description',
            'category': 'dinner',
            'prep_time': 10,
            'cook_time': 20,
            'difficulty': 'easy',
        }
        defaults.update(kwargs)
        return Recipe.objects.create(**defaults)
    return _create_recipe


@pytest.fixture
def ingredient_factory(db):
    """
    Factory fixture for creating Ingredient model instances.

    Usage:
        def test_example(ingredient_factory, recipe_factory):
            recipe = recipe_factory()
            ingredient = ingredient_factory(recipe=recipe, name='Flour')
    """
    def _create_ingredient(**kwargs):
        """Create an Ingredient instance."""
        # Note: 'recipe' must be provided by the test
        if 'recipe' not in kwargs:
            raise ValueError("ingredient_factory requires 'recipe' parameter")

        defaults = {
            'name': 'Test Ingredient',
            'measurement': '1 cup',
            'order': 0,
        }
        defaults.update(kwargs)
        return Ingredient.objects.create(**defaults)
    return _create_ingredient


@pytest.fixture
def recipe_with_ingredients_factory(recipe_factory, ingredient_factory):
    """
    Factory fixture for creating a Recipe with multiple Ingredients.

    This is a composed fixture that uses both recipe and ingredient factories.

    Usage:
        def test_example(recipe_with_ingredients_factory):
            recipe = recipe_with_ingredients_factory(
                recipe_kwargs={'name': 'Cookies'},
                ingredient_count=5
            )
    """
    def _create_recipe_with_ingredients(
        recipe_kwargs=None,
        ingredient_count=3,
        ingredient_kwargs_list=None
    ):
        """
        Create a recipe with specified number of ingredients.

        Args:
            recipe_kwargs: Dictionary of recipe field overrides
            ingredient_count: Number of ingredients to create
            ingredient_kwargs_list: List of dicts for each ingredient's overrides

        Returns:
            Recipe instance with ingredients attached
        """
        recipe_kwargs = recipe_kwargs or {}
        recipe = recipe_factory(**recipe_kwargs)

        if ingredient_kwargs_list:
            for i, ing_kwargs in enumerate(ingredient_kwargs_list):
                ing_kwargs.setdefault('recipe', recipe)
                ing_kwargs.setdefault('order', i)
                ingredient_factory(**ing_kwargs)
        else:
            for i in range(ingredient_count):
                ingredient_factory(
                    recipe=recipe,
                    name=f'Ingredient {i+1}',
                    measurement=f'{i+1} cups',
                    order=i
                )

        # Refresh to get related ingredients
        recipe.refresh_from_db()
        return recipe

    return _create_recipe_with_ingredients


# ============================================================================
# Shared Test Data
# ============================================================================

@pytest.fixture(scope='session')
def valid_categories():
    """
    Session-scoped fixture for valid recipe categories.

    This data doesn't change, so we can use session scope for efficiency.
    """
    return [
        'appetizers', 'baking_bread', 'breakfast', 'desserts',
        'dinner', 'drinks', 'international', 'lunch'
    ]


@pytest.fixture(scope='session')
def valid_difficulties():
    """
    Session-scoped fixture for valid difficulty levels.
    """
    return ['easy', 'medium', 'hard']


# ============================================================================
# Test Database Configuration
# ============================================================================

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Automatically enable database access for all tests.

    This removes the need to decorate every test with @pytest.mark.django_db.
    Use autouse=True with caution - only for projects where most tests need DB.

    Note: You can still use @pytest.mark.django_db(transaction=True)
    for tests that need transactional behavior.
    """
    pass
