"""
Unit tests for Recipe and Ingredient models.

Following pytest best practices:
- Using factory fixtures for flexible test data creation
- Parametrized tests for testing multiple scenarios
- Descriptive test names following "test_<what>_<when>_<expected>" pattern
- Proper use of pytest fixtures and marks
- Clear assertions with helpful failure messages
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone
from recipes.models import Recipe, Ingredient


# ============================================================================
# Recipe Model Tests
# ============================================================================

class TestRecipeCreation:
    """Tests for creating Recipe instances."""

    def test_create_recipe_with_minimal_required_fields_succeeds(self, recipe_factory):
        """Test creating a recipe with only required fields succeeds."""
        # Act
        recipe = recipe_factory(name='Minimal Recipe', prep_time=5, cook_time=10)

        # Assert
        assert recipe.id is not None, "Recipe should be saved with an ID"
        assert recipe.name == 'Minimal Recipe'
        assert recipe.prep_time == 5
        assert recipe.cook_time == 10

    def test_create_recipe_with_all_fields_succeeds(self, sample_recipe_data):
        """Test creating a recipe with all fields populated."""
        # Act
        recipe = Recipe.objects.create(**sample_recipe_data)

        # Assert
        assert recipe.id is not None
        assert recipe.name == sample_recipe_data['name']
        assert recipe.description == sample_recipe_data['description']
        assert recipe.category == sample_recipe_data['category']
        assert recipe.prep_time == sample_recipe_data['prep_time']
        assert recipe.cook_time == sample_recipe_data['cook_time']
        assert recipe.difficulty == sample_recipe_data['difficulty']

    def test_create_recipe_sets_timestamps_automatically(self, recipe_factory):
        """Test that created_at and updated_at are set automatically."""
        # Arrange
        before_creation = timezone.now()

        # Act
        recipe = recipe_factory()

        # Assert
        after_creation = timezone.now()
        assert recipe.created_at is not None, "created_at should be set"
        assert recipe.updated_at is not None, "updated_at should be set"
        assert before_creation <= recipe.created_at <= after_creation
        assert before_creation <= recipe.updated_at <= after_creation


class TestRecipeDefaults:
    """Tests for Recipe model default values."""

    def test_category_defaults_to_dinner(self, recipe_factory):
        """Test that category defaults to 'dinner' when not specified."""
        # Act
        recipe = recipe_factory()

        # Assert
        assert recipe.category == 'dinner', "Default category should be 'dinner'"

    def test_difficulty_defaults_to_easy(self, recipe_factory):
        """Test that difficulty defaults to 'easy' when not specified."""
        # Act
        recipe = recipe_factory()

        # Assert
        assert recipe.difficulty == 'easy', "Default difficulty should be 'easy'"

    def test_description_allows_blank(self, recipe_data_factory):
        """Test that description can be empty (blank=True)."""
        # Arrange
        data = recipe_data_factory(description='')

        # Act
        recipe = Recipe.objects.create(**data)

        # Assert
        assert recipe.description == '', "Description should allow blank values"

    def test_dietary_tags_defaults_to_empty_list(self, recipe_factory):
        """Test that dietary_tags defaults to an empty list."""
        # Act
        recipe = recipe_factory()

        # Assert
        assert recipe.dietary_tags == [], "Default dietary_tags should be empty list"


class TestRecipeDietaryTags:
    """Tests for Recipe dietary tags functionality."""

    def test_create_recipe_with_single_dietary_tag(self, recipe_factory):
        """Test creating a recipe with a single dietary tag."""
        # Act
        recipe = recipe_factory(dietary_tags=['vegan'])

        # Assert
        assert recipe.dietary_tags == ['vegan']
        assert 'vegan' in recipe.dietary_tags

    def test_create_recipe_with_multiple_dietary_tags(self, recipe_factory):
        """Test creating a recipe with multiple dietary tags."""
        # Act
        tags = ['vegan', 'gluten_free', 'nut_free']
        recipe = recipe_factory(dietary_tags=tags)

        # Assert
        assert recipe.dietary_tags == tags
        assert len(recipe.dietary_tags) == 3
        assert 'vegan' in recipe.dietary_tags
        assert 'gluten_free' in recipe.dietary_tags
        assert 'nut_free' in recipe.dietary_tags

    def test_create_recipe_with_empty_dietary_tags(self, recipe_factory):
        """Test creating a recipe with explicitly empty dietary tags."""
        # Act
        recipe = recipe_factory(dietary_tags=[])

        # Assert
        assert recipe.dietary_tags == []
        assert len(recipe.dietary_tags) == 0

    def test_update_recipe_dietary_tags(self, recipe_factory):
        """Test updating dietary tags on an existing recipe."""
        # Arrange
        recipe = recipe_factory(dietary_tags=['vegan'])

        # Act
        recipe.dietary_tags = ['vegan', 'gluten_free']
        recipe.save()
        recipe.refresh_from_db()

        # Assert
        assert recipe.dietary_tags == ['vegan', 'gluten_free']

    def test_remove_all_dietary_tags(self, recipe_factory):
        """Test removing all dietary tags from a recipe."""
        # Arrange
        recipe = recipe_factory(dietary_tags=['vegan', 'keto'])

        # Act
        recipe.dietary_tags = []
        recipe.save()
        recipe.refresh_from_db()

        # Assert
        assert recipe.dietary_tags == []


class TestRecipeValidation:
    """Tests for Recipe model field validation."""

    @pytest.mark.parametrize('difficulty', ['easy', 'medium', 'hard'])
    def test_difficulty_accepts_valid_choices(self, recipe_factory, difficulty):
        """Test that all valid difficulty choices are accepted."""
        # Act
        recipe = recipe_factory(difficulty=difficulty)

        # Assert
        assert recipe.difficulty == difficulty, (
            f"Difficulty '{difficulty}' should be valid"
        )

    @pytest.mark.parametrize('category', [
        'appetizers', 'baking_bread', 'breakfast', 'desserts',
        'dinner', 'drinks', 'international', 'lunch'
    ])
    def test_category_accepts_valid_choices(self, recipe_factory, category):
        """Test that all valid category choices are accepted."""
        # Act
        recipe = recipe_factory(category=category)

        # Assert
        assert recipe.category == category, (
            f"Category '{category}' should be valid"
        )

    @pytest.mark.parametrize(
        'time_field,time_value',
        [
            ('prep_time', 0),
            ('cook_time', 0),
            ('prep_time', 10080),  # 1 week in minutes
            ('cook_time', 10080),
        ],
        ids=['prep_time_minimum', 'cook_time_minimum', 'prep_time_maximum', 'cook_time_maximum']
    )
    def test_time_fields_accept_valid_values(self, recipe_factory, time_field, time_value):
        """Test that time fields accept values from 0 to 10080 minutes."""
        # Act
        kwargs = {time_field: time_value}
        recipe = recipe_factory(**kwargs)

        # Assert
        assert getattr(recipe, time_field) == time_value, (
            f"{time_field} should accept value {time_value}"
        )

    def test_name_maximum_length_is_200_characters(self, recipe_factory):
        """Test that recipe name can be up to 200 characters."""
        # Arrange
        long_name = 'A' * 200

        # Act
        recipe = recipe_factory(name=long_name)

        # Assert
        assert len(recipe.name) == 200, "Name should accept 200 characters"


class TestRecipeProperties:
    """Tests for Recipe model properties and computed fields."""

    @pytest.mark.parametrize(
        'prep_time,cook_time,expected_total',
        [
            (10, 20, 30),
            (0, 0, 0),
            (15, 12, 27),
            (100, 200, 300),
        ],
        ids=['simple', 'zero', 'realistic', 'large_values']
    )
    def test_total_time_property_calculates_correctly(
        self, recipe_factory, prep_time, cook_time, expected_total
    ):
        """Test that total_time property returns sum of prep and cook time."""
        # Arrange
        recipe = recipe_factory(prep_time=prep_time, cook_time=cook_time)

        # Act
        total = recipe.total_time

        # Assert
        assert total == expected_total, (
            f"total_time should be {expected_total} "
            f"(prep: {prep_time} + cook: {cook_time})"
        )


class TestRecipeStringRepresentation:
    """Tests for Recipe model string representation."""

    def test_str_returns_recipe_name(self, recipe_factory):
        """Test that __str__ method returns the recipe name."""
        # Arrange
        recipe = recipe_factory(name='Delicious Cookies')

        # Act
        result = str(recipe)

        # Assert
        assert result == 'Delicious Cookies', "__str__ should return recipe name"


class TestRecipeOrdering:
    """Tests for Recipe model ordering."""

    def test_recipes_ordered_by_category_then_creation_date_desc(self, recipe_factory):
        """Test that recipes are ordered by category, then -created_at."""
        # Arrange - create recipes in specific order
        recipe1 = recipe_factory(name='Recipe 1', category='dinner')
        recipe2 = recipe_factory(name='Recipe 2', category='appetizers')
        recipe3 = recipe_factory(name='Recipe 3', category='appetizers')

        # Act
        recipes = list(Recipe.objects.all())

        # Assert
        assert recipes[0].category == 'appetizers', "Appetizers should come first"
        assert recipes[1].category == 'appetizers'
        assert recipes[2].category == 'dinner', "Dinner should come last"
        # Within same category, newer first (Recipe 3 before Recipe 2)
        assert recipes[0].name == 'Recipe 3', "Newer recipe should be first"
        assert recipes[1].name == 'Recipe 2'


class TestRecipeTimestamps:
    """Tests for Recipe timestamp behavior."""

    def test_updated_at_changes_when_recipe_modified(self, recipe_factory):
        """Test that updated_at timestamp changes when recipe is updated."""
        # Arrange
        recipe = recipe_factory(name='Original Name')
        original_created_at = recipe.created_at
        original_updated_at = recipe.updated_at

        # Act - slight delay to ensure timestamp difference
        import time
        time.sleep(0.01)
        recipe.name = 'Updated Name'
        recipe.save()

        # Assert
        assert recipe.created_at == original_created_at, (
            "created_at should never change"
        )
        assert recipe.updated_at > original_updated_at, (
            "updated_at should be updated on save"
        )


# ============================================================================
# Ingredient Model Tests
# ============================================================================

class TestIngredientCreation:
    """Tests for creating Ingredient instances."""

    def test_create_ingredient_with_all_fields_succeeds(self, recipe_factory, ingredient_factory):
        """Test creating an ingredient with all fields."""
        # Arrange
        recipe = recipe_factory()

        # Act
        ingredient = ingredient_factory(
            recipe=recipe,
            name='Flour',
            measurement='2 cups',
            order=1
        )

        # Assert
        assert ingredient.id is not None, "Ingredient should be saved with an ID"
        assert ingredient.recipe == recipe
        assert ingredient.name == 'Flour'
        assert ingredient.measurement == '2 cups'
        assert ingredient.order == 1

    def test_order_defaults_to_zero_when_not_specified(self, recipe_factory, ingredient_factory):
        """Test that ingredient order defaults to 0."""
        # Arrange
        recipe = recipe_factory()

        # Act
        ingredient = ingredient_factory(recipe=recipe, name='Salt', measurement='1 tsp')

        # Assert
        assert ingredient.order == 0, "Default order should be 0"


class TestIngredientValidation:
    """Tests for Ingredient model validation."""

    def test_name_maximum_length_is_200_characters(self, recipe_factory, ingredient_factory):
        """Test that ingredient name can be up to 200 characters."""
        # Arrange
        recipe = recipe_factory()
        long_name = 'A' * 200

        # Act
        ingredient = ingredient_factory(recipe=recipe, name=long_name)

        # Assert
        assert len(ingredient.name) == 200, "Name should accept 200 characters"

    def test_measurement_maximum_length_is_100_characters(
        self, recipe_factory, ingredient_factory
    ):
        """Test that ingredient measurement can be up to 100 characters."""
        # Arrange
        recipe = recipe_factory()
        long_measurement = 'A' * 100

        # Act
        ingredient = ingredient_factory(
            recipe=recipe,
            name='Test',
            measurement=long_measurement
        )

        # Assert
        assert len(ingredient.measurement) == 100, (
            "Measurement should accept 100 characters"
        )


class TestIngredientStringRepresentation:
    """Tests for Ingredient model string representation."""

    def test_str_returns_measurement_and_name(self, recipe_factory, ingredient_factory):
        """Test that __str__ returns '{measurement} {name}'."""
        # Arrange
        recipe = recipe_factory()
        ingredient = ingredient_factory(
            recipe=recipe,
            name='Sugar',
            measurement='1 cup'
        )

        # Act
        result = str(ingredient)

        # Assert
        assert result == '1 cup Sugar', (
            "__str__ should return '{measurement} {name}'"
        )


class TestIngredientOrdering:
    """Tests for Ingredient model ordering."""

    def test_ingredients_ordered_by_order_field_then_id(
        self, recipe_factory, ingredient_factory
    ):
        """Test that ingredients are ordered by 'order' field, then by ID."""
        # Arrange
        recipe = recipe_factory()
        ing1 = ingredient_factory(recipe=recipe, name='Third', order=3)
        ing2 = ingredient_factory(recipe=recipe, name='First', order=1)
        ing3 = ingredient_factory(recipe=recipe, name='Second', order=2)

        # Act
        ingredients = list(Ingredient.objects.filter(recipe=recipe))

        # Assert
        assert ingredients[0] == ing2, "Order 1 should be first"
        assert ingredients[1] == ing3, "Order 2 should be second"
        assert ingredients[2] == ing1, "Order 3 should be third"


# ============================================================================
# Recipe-Ingredient Relationship Tests
# ============================================================================

class TestRecipeIngredientRelationship:
    """Tests for the relationship between Recipe and Ingredient models."""

    def test_recipe_can_have_multiple_ingredients(
        self, recipe_factory, ingredient_factory
    ):
        """Test that a recipe can have multiple ingredients."""
        # Arrange
        recipe = recipe_factory()

        # Act
        for i in range(5):
            ingredient_factory(
                recipe=recipe,
                name=f'Ingredient {i}',
                measurement=f'{i} cups',
                order=i
            )

        # Assert
        assert recipe.ingredients.count() == 5, "Recipe should have 5 ingredients"

    def test_recipe_can_exist_without_ingredients(self, recipe_factory):
        """Test that a recipe doesn't require ingredients."""
        # Act
        recipe = recipe_factory()

        # Assert
        assert recipe.ingredients.count() == 0, (
            "Recipe should be valid with no ingredients"
        )

    def test_ingredient_belongs_to_exactly_one_recipe(
        self, recipe_factory, ingredient_factory
    ):
        """Test that each ingredient belongs to exactly one recipe."""
        # Arrange
        recipe1 = recipe_factory(name='Recipe 1')
        recipe2 = recipe_factory(name='Recipe 2')

        # Act
        ingredient = ingredient_factory(
            recipe=recipe1,
            name='Shared Ingredient',
            measurement='1 cup'
        )

        # Assert
        assert ingredient.recipe == recipe1, "Ingredient should belong to recipe1"
        assert ingredient.recipe != recipe2, "Ingredient should not belong to recipe2"

    def test_deleting_recipe_cascades_to_ingredients(
        self, recipe_factory, ingredient_factory
    ):
        """Test that deleting a recipe also deletes its ingredients (CASCADE)."""
        # Arrange
        recipe = recipe_factory()
        ingredient_factory(recipe=recipe, name='Ing 1', measurement='1 cup')
        ingredient_factory(recipe=recipe, name='Ing 2', measurement='2 cups')

        recipe_id = recipe.id
        assert Ingredient.objects.filter(recipe_id=recipe_id).count() == 2

        # Act
        recipe.delete()

        # Assert
        assert not Recipe.objects.filter(id=recipe_id).exists(), (
            "Recipe should be deleted"
        )
        assert Ingredient.objects.filter(recipe_id=recipe_id).count() == 0, (
            "All ingredients should be deleted when recipe is deleted"
        )

    def test_ingredients_accessible_via_related_name(self, recipe_factory, ingredient_factory):
        """Test that ingredients are accessible via recipe.ingredients."""
        # Arrange
        recipe = recipe_factory()
        ing1 = ingredient_factory(recipe=recipe, name='Flour', measurement='2 cups', order=1)
        ing2 = ingredient_factory(recipe=recipe, name='Sugar', measurement='1 cup', order=2)

        # Act
        ingredients = recipe.ingredients.all()

        # Assert
        assert list(ingredients) == [ing1, ing2], (
            "Ingredients should be accessible via recipe.ingredients"
        )

    def test_filtering_ingredients_by_recipe(self, recipe_factory, ingredient_factory):
        """Test filtering ingredients by recipe."""
        # Arrange
        recipe1 = recipe_factory(name='Recipe 1')
        recipe2 = recipe_factory(name='Recipe 2')

        ing1 = ingredient_factory(recipe=recipe1, name='Ing 1', measurement='1 cup')
        ing2 = ingredient_factory(recipe=recipe1, name='Ing 2', measurement='2 cups')
        ing3 = ingredient_factory(recipe=recipe2, name='Ing 3', measurement='3 cups')

        # Act
        recipe1_ings = Ingredient.objects.filter(recipe=recipe1)
        recipe2_ings = Ingredient.objects.filter(recipe=recipe2)

        # Assert
        assert recipe1_ings.count() == 2, "Recipe 1 should have 2 ingredients"
        assert recipe2_ings.count() == 1, "Recipe 2 should have 1 ingredient"
        assert set(recipe1_ings) == {ing1, ing2}
        assert set(recipe2_ings) == {ing3}


# ============================================================================
# Advanced Tests Using Factory Fixtures
# ============================================================================

class TestRecipeWithIngredientsFactory:
    """Tests using the recipe_with_ingredients_factory fixture."""

    def test_factory_creates_recipe_with_default_ingredients(
        self, recipe_with_ingredients_factory
    ):
        """Test that factory creates recipe with default number of ingredients."""
        # Act
        recipe = recipe_with_ingredients_factory()

        # Assert
        assert recipe.ingredients.count() == 3, (
            "Default should create 3 ingredients"
        )

    def test_factory_creates_custom_number_of_ingredients(
        self, recipe_with_ingredients_factory
    ):
        """Test that factory can create custom number of ingredients."""
        # Act
        recipe = recipe_with_ingredients_factory(ingredient_count=7)

        # Assert
        assert recipe.ingredients.count() == 7, (
            "Should create specified number of ingredients"
        )

    def test_factory_accepts_custom_recipe_attributes(
        self, recipe_with_ingredients_factory
    ):
        """Test that factory accepts custom recipe attributes."""
        # Act
        recipe = recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Custom Recipe', 'difficulty': 'hard'}
        )

        # Assert
        assert recipe.name == 'Custom Recipe'
        assert recipe.difficulty == 'hard'

    def test_factory_accepts_custom_ingredient_attributes(
        self, recipe_with_ingredients_factory
    ):
        """Test that factory accepts custom ingredient attributes."""
        # Arrange
        ingredient_list = [
            {'name': 'Flour', 'measurement': '3 cups'},
            {'name': 'Sugar', 'measurement': '2 cups'},
        ]

        # Act
        recipe = recipe_with_ingredients_factory(
            ingredient_kwargs_list=ingredient_list
        )

        # Assert
        assert recipe.ingredients.count() == 2
        assert recipe.ingredients.first().name == 'Flour'
        assert recipe.ingredients.last().name == 'Sugar'


# ============================================================================
# Edge Cases and Boundary Tests
# ============================================================================

class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_recipe_with_very_long_description(self, recipe_factory):
        """Test recipe with extremely long description."""
        # Arrange
        long_description = 'A' * 10000  # Very long text

        # Act
        recipe = recipe_factory(description=long_description)

        # Assert
        assert len(recipe.description) == 10000, (
            "Should handle very long descriptions"
        )

    def test_multiple_ingredients_with_same_order(
        self, recipe_factory, ingredient_factory
    ):
        """Test that multiple ingredients can have the same order value."""
        # Arrange
        recipe = recipe_factory()

        # Act
        ing1 = ingredient_factory(recipe=recipe, name='First', order=1)
        ing2 = ingredient_factory(recipe=recipe, name='Second', order=1)

        # Assert - both should exist, ordered by id as secondary sort
        ingredients = list(recipe.ingredients.all())
        assert len(ingredients) == 2
        assert ingredients[0] == ing1, "Should be ordered by ID when order is same"
        assert ingredients[1] == ing2

    def test_recipe_with_special_characters_in_name(self, recipe_factory):
        """Test recipe name with special characters."""
        # Arrange
        special_name = "Mom's Recipe: Chicken & Dumplings (Best!)"

        # Act
        recipe = recipe_factory(name=special_name)

        # Assert
        assert recipe.name == special_name, (
            "Should handle special characters in name"
        )

    def test_ingredient_with_unicode_characters(
        self, recipe_factory, ingredient_factory
    ):
        """Test ingredient with unicode characters."""
        # Arrange
        recipe = recipe_factory()
        unicode_name = "Jalapeño peppers"

        # Act
        ingredient = ingredient_factory(
            recipe=recipe,
            name=unicode_name,
            measurement='2 whole'
        )

        # Assert
        assert ingredient.name == unicode_name, (
            "Should handle unicode characters"
        )
