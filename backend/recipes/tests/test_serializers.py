"""
Unit tests for Recipe and Ingredient serializers.

Tests cover:
- Serialization and deserialization
- Nested ingredient handling
- Validation logic
- Create and update operations
"""
import pytest
from recipes.models import Recipe, Ingredient
from recipes.serializers import RecipeSerializer, IngredientSerializer


@pytest.mark.django_db
@pytest.mark.unit
class TestIngredientSerializer:
    """Test suite for IngredientSerializer."""

    def test_serialize_ingredient(self, sample_recipe_data):
        """Test serializing an ingredient to JSON."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        ingredient = Ingredient.objects.create(
            recipe=recipe,
            name='Flour',
            measurement='2 cups',
            order=1
        )

        serializer = IngredientSerializer(ingredient)
        data = serializer.data

        assert data['id'] == ingredient.id
        assert data['name'] == 'Flour'
        assert data['measurement'] == '2 cups'
        assert data['order'] == 1

    def test_deserialize_ingredient(self):
        """Test deserializing ingredient data."""
        data = {
            'name': 'Sugar',
            'measurement': '1 cup',
            'order': 2
        }

        serializer = IngredientSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['name'] == 'Sugar'
        assert serializer.validated_data['measurement'] == '1 cup'
        assert serializer.validated_data['order'] == 2

    def test_ingredient_serializer_fields(self, sample_recipe_data):
        """Test that all expected fields are included."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        ingredient = Ingredient.objects.create(
            recipe=recipe,
            name='Butter',
            measurement='1/2 cup',
            order=3
        )

        serializer = IngredientSerializer(ingredient)
        assert set(serializer.data.keys()) == {'id', 'name', 'measurement', 'order'}

    def test_ingredient_serializer_validation_missing_name(self):
        """Test validation fails when name is missing."""
        data = {
            'measurement': '1 cup',
            'order': 1
        }

        serializer = IngredientSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_ingredient_serializer_validation_missing_measurement(self):
        """Test validation fails when measurement is missing."""
        data = {
            'name': 'Salt',
            'order': 1
        }

        serializer = IngredientSerializer(data=data)
        assert not serializer.is_valid()
        assert 'measurement' in serializer.errors


@pytest.mark.django_db
@pytest.mark.unit
class TestRecipeSerializer:
    """Test suite for RecipeSerializer."""

    def test_serialize_recipe_without_ingredients(self, sample_recipe_data):
        """Test serializing a recipe without ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        serializer = RecipeSerializer(recipe)
        data = serializer.data

        assert data['id'] == recipe.id
        assert data['name'] == sample_recipe_data['name']
        assert data['description'] == sample_recipe_data['description']
        assert data['category'] == sample_recipe_data['category']
        assert data['prep_time'] == sample_recipe_data['prep_time']
        assert data['cook_time'] == sample_recipe_data['cook_time']
        assert data['difficulty'] == sample_recipe_data['difficulty']
        assert data['ingredients'] == []
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_serialize_recipe_with_ingredients(self, sample_recipe_data, sample_ingredient_data):
        """Test serializing a recipe with nested ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        for ing_data in sample_ingredient_data:
            Ingredient.objects.create(recipe=recipe, **ing_data)

        serializer = RecipeSerializer(recipe)
        data = serializer.data

        assert len(data['ingredients']) == len(sample_ingredient_data)
        assert data['ingredients'][0]['name'] == sample_ingredient_data[0]['name']
        assert data['ingredients'][0]['measurement'] == sample_ingredient_data[0]['measurement']

    def test_deserialize_recipe_without_ingredients(self, sample_recipe_data):
        """Test deserializing recipe data without ingredients."""
        serializer = RecipeSerializer(data=sample_recipe_data)

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data['name'] == sample_recipe_data['name']
        assert serializer.validated_data['category'] == sample_recipe_data['category']

    def test_deserialize_recipe_with_ingredients(self, sample_recipe_with_ingredients_data):
        """Test deserializing recipe data with nested ingredients."""
        serializer = RecipeSerializer(data=sample_recipe_with_ingredients_data)

        assert serializer.is_valid(), serializer.errors
        assert 'ingredients' in serializer.validated_data
        assert len(serializer.validated_data['ingredients']) == 4

    def test_create_recipe_without_ingredients(self, sample_recipe_data):
        """Test creating a recipe without ingredients via serializer."""
        serializer = RecipeSerializer(data=sample_recipe_data)

        assert serializer.is_valid(), serializer.errors
        recipe = serializer.save()

        assert recipe.id is not None
        assert recipe.name == sample_recipe_data['name']
        assert recipe.ingredients.count() == 0

    def test_create_recipe_with_ingredients(self, sample_recipe_with_ingredients_data):
        """Test creating a recipe with nested ingredients via serializer."""
        serializer = RecipeSerializer(data=sample_recipe_with_ingredients_data)

        assert serializer.is_valid(), serializer.errors
        recipe = serializer.save()

        assert recipe.id is not None
        assert recipe.ingredients.count() == 4
        assert recipe.ingredients.first().name == sample_recipe_with_ingredients_data['ingredients'][0]['name']

    def test_update_recipe_basic_fields(self, sample_recipe_data):
        """Test updating recipe basic fields."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        update_data = {
            'name': 'Updated Recipe Name',
            'difficulty': 'hard',
            'prep_time': 30,
            'cook_time': 45
        }

        serializer = RecipeSerializer(recipe, data=update_data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated_recipe = serializer.save()

        assert updated_recipe.name == 'Updated Recipe Name'
        assert updated_recipe.difficulty == 'hard'
        assert updated_recipe.prep_time == 30
        assert updated_recipe.cook_time == 45

    def test_update_recipe_replace_ingredients(self, sample_recipe_data, sample_ingredient_data):
        """Test updating recipe replaces all ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        # Create initial ingredients
        for ing_data in sample_ingredient_data:
            Ingredient.objects.create(recipe=recipe, **ing_data)

        assert recipe.ingredients.count() == 4

        # Update with new ingredients
        new_ingredients = [
            {'name': 'New Ingredient 1', 'measurement': '1 cup', 'order': 1},
            {'name': 'New Ingredient 2', 'measurement': '2 cups', 'order': 2},
        ]

        update_data = {
            'name': recipe.name,
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'ingredients': new_ingredients
        }

        serializer = RecipeSerializer(recipe, data=update_data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated_recipe = serializer.save()

        # Should have new ingredients, old ones deleted
        assert updated_recipe.ingredients.count() == 2
        ingredient_names = [ing.name for ing in updated_recipe.ingredients.all()]
        assert 'New Ingredient 1' in ingredient_names
        assert 'New Ingredient 2' in ingredient_names
        assert 'All-purpose flour' not in ingredient_names  # Old ingredient removed

    def test_update_recipe_without_ingredients_field(self, sample_recipe_data, sample_ingredient_data):
        """Test updating recipe without ingredients field preserves existing ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        # Create initial ingredients
        for ing_data in sample_ingredient_data:
            Ingredient.objects.create(recipe=recipe, **ing_data)

        original_count = recipe.ingredients.count()

        # Update recipe without touching ingredients
        update_data = {
            'name': 'Updated Name',
            'prep_time': 25
        }

        serializer = RecipeSerializer(recipe, data=update_data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated_recipe = serializer.save()

        # Ingredients should remain unchanged
        assert updated_recipe.ingredients.count() == original_count
        assert updated_recipe.name == 'Updated Name'

    def test_recipe_serializer_read_only_fields(self, sample_recipe_data):
        """Test that created_at and updated_at are read-only."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        original_created_at = recipe.created_at

        # Try to update read-only fields
        update_data = {
            'name': 'Updated Recipe',
            'created_at': '2020-01-01T00:00:00Z',
            'updated_at': '2020-01-01T00:00:00Z'
        }

        serializer = RecipeSerializer(recipe, data=update_data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated_recipe = serializer.save()

        # created_at should not change
        assert updated_recipe.created_at == original_created_at
        assert updated_recipe.name == 'Updated Recipe'

    def test_recipe_serializer_validation_missing_name(self):
        """Test validation fails when name is missing."""
        data = {
            'prep_time': 10,
            'cook_time': 20
        }

        serializer = RecipeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_recipe_serializer_validation_missing_prep_time(self, sample_recipe_data):
        """Test validation fails when prep_time is missing."""
        data = sample_recipe_data.copy()
        del data['prep_time']

        serializer = RecipeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'prep_time' in serializer.errors

    def test_recipe_serializer_validation_missing_cook_time(self, sample_recipe_data):
        """Test validation fails when cook_time is missing."""
        data = sample_recipe_data.copy()
        del data['cook_time']

        serializer = RecipeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cook_time' in serializer.errors

    def test_recipe_serializer_validation_invalid_category(self, sample_recipe_data):
        """Test validation fails with invalid category."""
        data = sample_recipe_data.copy()
        data['category'] = 'invalid_category'

        serializer = RecipeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'category' in serializer.errors

    def test_recipe_serializer_validation_invalid_difficulty(self, sample_recipe_data):
        """Test validation fails with invalid difficulty."""
        data = sample_recipe_data.copy()
        data['difficulty'] = 'super_hard'

        serializer = RecipeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'difficulty' in serializer.errors

    def test_recipe_serializer_all_fields_present(self, sample_recipe_data):
        """Test that all expected fields are included in serialized data."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        serializer = RecipeSerializer(recipe)

        expected_fields = {
            'id', 'name', 'description', 'category', 'prep_time',
            'cook_time', 'difficulty', 'dietary_tags', 'ingredients',
            'owner', 'owner_username', 'is_private', 'is_favorited', 'favorites_count',
            'created_at', 'updated_at'
        }
        assert set(serializer.data.keys()) == expected_fields

    def test_update_recipe_empty_ingredients_list(self, sample_recipe_data, sample_ingredient_data):
        """Test updating recipe with empty ingredients list removes all ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        # Create initial ingredients
        for ing_data in sample_ingredient_data:
            Ingredient.objects.create(recipe=recipe, **ing_data)

        assert recipe.ingredients.count() == 4

        # Update with empty ingredients list
        update_data = {
            'name': recipe.name,
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'ingredients': []
        }

        serializer = RecipeSerializer(recipe, data=update_data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated_recipe = serializer.save()

        # All ingredients should be deleted
        assert updated_recipe.ingredients.count() == 0

    def test_create_recipe_with_ingredient_order(self):
        """Test that ingredient order is preserved during creation."""
        data = {
            'name': 'Test Recipe',
            'prep_time': 10,
            'cook_time': 20,
            'ingredients': [
                {'name': 'Third', 'measurement': '1', 'order': 3},
                {'name': 'First', 'measurement': '1', 'order': 1},
                {'name': 'Second', 'measurement': '1', 'order': 2},
            ]
        }

        serializer = RecipeSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        recipe = serializer.save()

        ingredients = list(recipe.ingredients.all())
        assert ingredients[0].name == 'First'
        assert ingredients[1].name == 'Second'
        assert ingredients[2].name == 'Third'
