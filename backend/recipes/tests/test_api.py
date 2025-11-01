"""
API endpoint tests for Recipe ViewSet.

Tests cover:
- List recipes (GET /api/recipes/)
- Create recipe (POST /api/recipes/)
- Retrieve recipe (GET /api/recipes/{id}/)
- Update recipe (PUT /api/recipes/{id}/)
- Partial update recipe (PATCH /api/recipes/{id}/)
- Delete recipe (DELETE /api/recipes/{id}/)
- Nested ingredient operations
"""
import pytest
from rest_framework import status
from recipes.models import Recipe, Ingredient


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeListEndpoint:
    """Test suite for GET /api/recipes/ endpoint."""

    def test_list_recipes_empty(self, api_client):
        """Test listing recipes when database is empty."""
        response = api_client.get('/api/recipes/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_list_recipes_with_data(self, api_client, sample_recipe_data):
        """Test listing multiple recipes."""
        Recipe.objects.create(name='Recipe 1', prep_time=10, cook_time=10)
        Recipe.objects.create(name='Recipe 2', prep_time=20, cook_time=20)
        Recipe.objects.create(name='Recipe 3', prep_time=30, cook_time=30)

        response = api_client.get('/api/recipes/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_list_recipes_includes_ingredients(self, api_client, sample_recipe_data):
        """Test that listed recipes include nested ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Flour', measurement='2 cups', order=1)
        Ingredient.objects.create(recipe=recipe, name='Sugar', measurement='1 cup', order=2)

        response = api_client.get('/api/recipes/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert len(response.data[0]['ingredients']) == 2
        assert response.data[0]['ingredients'][0]['name'] == 'Flour'

    def test_list_recipes_ordering(self, api_client):
        """Test that recipes are ordered correctly (category, -created_at)."""
        Recipe.objects.create(name='Dinner 1', category='dinner', prep_time=10, cook_time=10)
        Recipe.objects.create(name='Appetizer 1', category='appetizers', prep_time=10, cook_time=10)
        Recipe.objects.create(name='Appetizer 2', category='appetizers', prep_time=10, cook_time=10)

        response = api_client.get('/api/recipes/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['category'] == 'appetizers'
        assert response.data[1]['category'] == 'appetizers'
        assert response.data[2]['category'] == 'dinner'
        # Within same category, newer first
        assert response.data[0]['name'] == 'Appetizer 2'
        assert response.data[1]['name'] == 'Appetizer 1'


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeCreateEndpoint:
    """Test suite for POST /api/recipes/ endpoint."""

    def test_create_recipe_without_ingredients(self, api_client, sample_recipe_data):
        """Test creating a recipe without ingredients."""
        response = api_client.post('/api/recipes/', sample_recipe_data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == sample_recipe_data['name']
        assert response.data['category'] == sample_recipe_data['category']
        assert response.data['ingredients'] == []
        assert 'id' in response.data
        assert 'created_at' in response.data

        # Verify in database
        assert Recipe.objects.count() == 1
        recipe = Recipe.objects.first()
        assert recipe.name == sample_recipe_data['name']

    def test_create_recipe_with_ingredients(self, api_client, sample_recipe_with_ingredients_data):
        """Test creating a recipe with nested ingredients."""
        response = api_client.post('/api/recipes/', sample_recipe_with_ingredients_data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['ingredients']) == 4
        assert response.data['ingredients'][0]['name'] == 'All-purpose flour'

        # Verify in database
        assert Recipe.objects.count() == 1
        recipe = Recipe.objects.first()
        assert recipe.ingredients.count() == 4

    def test_create_recipe_missing_required_fields(self, api_client):
        """Test creating recipe with missing required fields returns 400."""
        data = {
            'description': 'Missing required fields'
        }

        response = api_client.post('/api/recipes/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data
        assert 'prep_time' in response.data
        assert 'cook_time' in response.data

    def test_create_recipe_invalid_category(self, api_client, sample_recipe_data):
        """Test creating recipe with invalid category returns 400."""
        data = sample_recipe_data.copy()
        data['category'] = 'invalid_category'

        response = api_client.post('/api/recipes/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'category' in response.data

    def test_create_recipe_invalid_difficulty(self, api_client, sample_recipe_data):
        """Test creating recipe with invalid difficulty returns 400."""
        data = sample_recipe_data.copy()
        data['difficulty'] = 'impossible'

        response = api_client.post('/api/recipes/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'difficulty' in response.data

    def test_create_recipe_with_default_values(self, api_client):
        """Test creating recipe uses default values for optional fields."""
        data = {
            'name': 'Simple Recipe',
            'prep_time': 10,
            'cook_time': 20
        }

        response = api_client.post('/api/recipes/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['category'] == 'dinner'  # Default
        assert response.data['difficulty'] == 'easy'  # Default
        assert response.data['description'] == ''  # Blank default

    def test_create_recipe_ingredients_with_order(self, api_client):
        """Test that ingredient order is preserved when creating recipe."""
        data = {
            'name': 'Ordered Recipe',
            'prep_time': 10,
            'cook_time': 20,
            'ingredients': [
                {'name': 'Third', 'measurement': '1', 'order': 3},
                {'name': 'First', 'measurement': '1', 'order': 1},
                {'name': 'Second', 'measurement': '1', 'order': 2},
            ]
        }

        response = api_client.post('/api/recipes/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        # Response should be ordered
        assert response.data['ingredients'][0]['name'] == 'First'
        assert response.data['ingredients'][1]['name'] == 'Second'
        assert response.data['ingredients'][2]['name'] == 'Third'


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeRetrieveEndpoint:
    """Test suite for GET /api/recipes/{id}/ endpoint."""

    def test_retrieve_recipe(self, api_client, sample_recipe_data):
        """Test retrieving a specific recipe by ID."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        response = api_client.get(f'/api/recipes/{recipe.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == recipe.id
        assert response.data['name'] == sample_recipe_data['name']

    def test_retrieve_recipe_with_ingredients(self, api_client, sample_recipe_data):
        """Test retrieving recipe includes nested ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Flour', measurement='2 cups', order=1)
        Ingredient.objects.create(recipe=recipe, name='Sugar', measurement='1 cup', order=2)

        response = api_client.get(f'/api/recipes/{recipe.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['ingredients']) == 2
        assert response.data['ingredients'][0]['name'] == 'Flour'
        assert response.data['ingredients'][1]['name'] == 'Sugar'

    def test_retrieve_nonexistent_recipe(self, api_client):
        """Test retrieving non-existent recipe returns 404."""
        response = api_client.get('/api/recipes/99999/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_recipe_includes_timestamps(self, api_client, sample_recipe_data):
        """Test that retrieved recipe includes timestamp fields."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        response = api_client.get(f'/api/recipes/{recipe.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert 'created_at' in response.data
        assert 'updated_at' in response.data


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeUpdateEndpoint:
    """Test suite for PUT /api/recipes/{id}/ endpoint."""

    def test_update_recipe_full(self, api_client, sample_recipe_data):
        """Test full update of recipe with PUT."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        update_data = {
            'name': 'Updated Recipe Name',
            'description': 'Updated description',
            'category': 'breakfast',
            'prep_time': 25,
            'cook_time': 35,
            'difficulty': 'hard'
        }

        response = api_client.put(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Recipe Name'
        assert response.data['category'] == 'breakfast'
        assert response.data['difficulty'] == 'hard'
        assert response.data['prep_time'] == 25
        assert response.data['cook_time'] == 35

        # Verify in database
        recipe.refresh_from_db()
        assert recipe.name == 'Updated Recipe Name'

    def test_update_recipe_replace_ingredients(self, api_client, sample_recipe_data):
        """Test updating recipe replaces ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Old Ing 1', measurement='1 cup', order=1)
        Ingredient.objects.create(recipe=recipe, name='Old Ing 2', measurement='2 cups', order=2)

        update_data = {
            'name': recipe.name,
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'ingredients': [
                {'name': 'New Ing 1', 'measurement': '3 cups', 'order': 1},
            ]
        }

        response = api_client.put(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['ingredients']) == 1
        assert response.data['ingredients'][0]['name'] == 'New Ing 1'

        # Verify in database
        recipe.refresh_from_db()
        assert recipe.ingredients.count() == 1
        assert recipe.ingredients.first().name == 'New Ing 1'

    def test_update_nonexistent_recipe(self, api_client, sample_recipe_data):
        """Test updating non-existent recipe returns 404."""
        response = api_client.put('/api/recipes/99999/', sample_recipe_data, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipePartialUpdateEndpoint:
    """Test suite for PATCH /api/recipes/{id}/ endpoint."""

    def test_partial_update_recipe_name_only(self, api_client, sample_recipe_data):
        """Test partial update of only recipe name."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        original_prep_time = recipe.prep_time

        update_data = {'name': 'Partially Updated Name'}

        response = api_client.patch(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Partially Updated Name'
        assert response.data['prep_time'] == original_prep_time  # Unchanged

    def test_partial_update_recipe_time_fields(self, api_client, sample_recipe_data):
        """Test partial update of time fields only."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        original_name = recipe.name

        update_data = {
            'prep_time': 50,
            'cook_time': 60
        }

        response = api_client.patch(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['prep_time'] == 50
        assert response.data['cook_time'] == 60
        assert response.data['name'] == original_name  # Unchanged

    def test_partial_update_recipe_ingredients_only(self, api_client, sample_recipe_data):
        """Test partial update of ingredients only."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Old', measurement='1', order=1)

        update_data = {
            'ingredients': [
                {'name': 'New', 'measurement': '2', 'order': 1}
            ]
        }

        response = api_client.patch(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['ingredients']) == 1
        assert response.data['ingredients'][0]['name'] == 'New'

    def test_partial_update_invalid_field(self, api_client, sample_recipe_data):
        """Test partial update with invalid field value returns 400."""
        recipe = Recipe.objects.create(**sample_recipe_data)

        update_data = {'difficulty': 'invalid'}

        response = api_client.patch(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'difficulty' in response.data


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeDeleteEndpoint:
    """Test suite for DELETE /api/recipes/{id}/ endpoint."""

    def test_delete_recipe(self, api_client, sample_recipe_data):
        """Test deleting a recipe."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        recipe_id = recipe.id

        response = api_client.delete(f'/api/recipes/{recipe_id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Recipe.objects.filter(id=recipe_id).count() == 0

    def test_delete_recipe_cascades_to_ingredients(self, api_client, sample_recipe_data):
        """Test deleting recipe also deletes associated ingredients."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Ing 1', measurement='1', order=1)
        Ingredient.objects.create(recipe=recipe, name='Ing 2', measurement='2', order=2)

        assert Ingredient.objects.filter(recipe=recipe).count() == 2

        response = api_client.delete(f'/api/recipes/{recipe.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Ingredient.objects.filter(recipe=recipe).count() == 0

    def test_delete_nonexistent_recipe(self, api_client):
        """Test deleting non-existent recipe returns 404."""
        response = api_client.delete('/api/recipes/99999/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_recipe_idempotent(self, api_client, sample_recipe_data):
        """Test that deleting already deleted recipe returns 404."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        recipe_id = recipe.id

        # First delete
        response1 = api_client.delete(f'/api/recipes/{recipe_id}/')
        assert response1.status_code == status.HTTP_204_NO_CONTENT

        # Second delete should return 404
        response2 = api_client.delete(f'/api/recipes/{recipe_id}/')
        assert response2.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
@pytest.mark.integration
class TestRecipeAPIComplexScenarios:
    """Test suite for complex API scenarios."""

    def test_create_multiple_recipes_with_ingredients(self, api_client):
        """Test creating multiple recipes with ingredients."""
        recipes_data = [
            {
                'name': f'Recipe {i}',
                'prep_time': 10 * i,
                'cook_time': 20 * i,
                'ingredients': [
                    {'name': f'Ing {j}', 'measurement': f'{j} cups', 'order': j}
                    for j in range(1, 4)
                ]
            }
            for i in range(1, 4)
        ]

        for recipe_data in recipes_data:
            response = api_client.post('/api/recipes/', recipe_data, format='json')
            assert response.status_code == status.HTTP_201_CREATED

        assert Recipe.objects.count() == 3
        assert Ingredient.objects.count() == 9

    def test_update_recipe_maintains_relationships(self, api_client, sample_recipe_data):
        """Test that updating recipe maintains proper relationships."""
        recipe = Recipe.objects.create(**sample_recipe_data)
        Ingredient.objects.create(recipe=recipe, name='Orig', measurement='1', order=1)

        # Update with new ingredients
        update_data = {
            'name': 'Updated Recipe',
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'ingredients': [
                {'name': 'New 1', 'measurement': '1', 'order': 1},
                {'name': 'New 2', 'measurement': '2', 'order': 2},
            ]
        }

        response = api_client.put(f'/api/recipes/{recipe.id}/', update_data, format='json')

        assert response.status_code == status.HTTP_200_OK

        # All ingredients should belong to the same recipe
        recipe.refresh_from_db()
        for ingredient in recipe.ingredients.all():
            assert ingredient.recipe_id == recipe.id

    def test_list_filter_retrieve_workflow(self, api_client, sample_recipe_data):
        """Test complete workflow: create, list, retrieve."""
        # Create
        create_response = api_client.post('/api/recipes/', sample_recipe_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        recipe_id = create_response.data['id']

        # List
        list_response = api_client.get('/api/recipes/')
        assert list_response.status_code == status.HTTP_200_OK
        assert len(list_response.data) == 1

        # Retrieve
        retrieve_response = api_client.get(f'/api/recipes/{recipe_id}/')
        assert retrieve_response.status_code == status.HTTP_200_OK
        assert retrieve_response.data['id'] == recipe_id


# ============================================================================
# Recipe Search and Filtering Tests
# ============================================================================

class TestRecipeSearch:
    """Tests for recipe search functionality."""

    def test_search_by_name_returns_matching_recipes(self, api_client, recipe_factory):
        """Test searching for recipes by name."""
        # Arrange
        recipe_factory(name='Chocolate Cake')
        recipe_factory(name='Vanilla Cake')
        recipe_factory(name='Strawberry Smoothie')

        # Act
        response = api_client.get('/api/recipes/', {'search': 'Cake'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        recipe_names = [r['name'] for r in response.data]
        assert 'Chocolate Cake' in recipe_names
        assert 'Vanilla Cake' in recipe_names
        assert 'Strawberry Smoothie' not in recipe_names

    def test_search_is_case_insensitive(self, api_client, recipe_factory):
        """Test that search is case insensitive."""
        # Arrange
        recipe_factory(name='Chocolate Cake')

        # Act
        response = api_client.get('/api/recipes/', {'search': 'chocolate'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Chocolate Cake'

    def test_search_with_no_matches_returns_empty(self, api_client, recipe_factory):
        """Test that search with no matches returns empty list."""
        # Arrange
        recipe_factory(name='Chocolate Cake')

        # Act
        response = api_client.get('/api/recipes/', {'search': 'Pizza'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0


class TestRecipeDifficultyFilter:
    """Tests for filtering recipes by difficulty."""

    def test_filter_by_difficulty_easy(self, api_client, recipe_factory):
        """Test filtering recipes by easy difficulty."""
        # Arrange
        recipe_factory(name='Easy Recipe', difficulty='easy')
        recipe_factory(name='Hard Recipe', difficulty='hard')

        # Act
        response = api_client.get('/api/recipes/', {'difficulty': 'easy'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['difficulty'] == 'easy'

    def test_filter_by_difficulty_medium(self, api_client, recipe_factory):
        """Test filtering recipes by medium difficulty."""
        # Arrange
        recipe_factory(difficulty='easy')
        recipe_factory(difficulty='medium')
        recipe_factory(difficulty='hard')

        # Act
        response = api_client.get('/api/recipes/', {'difficulty': 'medium'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['difficulty'] == 'medium'


class TestRecipeTimeFilters:
    """Tests for filtering recipes by prep and cook time."""

    def test_filter_by_max_prep_time(self, api_client, recipe_factory):
        """Test filtering recipes by maximum prep time."""
        # Arrange
        recipe_factory(name='Quick Recipe', prep_time=10, cook_time=15)
        recipe_factory(name='Slow Recipe', prep_time=60, cook_time=120)

        # Act
        response = api_client.get('/api/recipes/', {'max_prep_time': '30'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Quick Recipe'

    def test_filter_by_max_cook_time(self, api_client, recipe_factory):
        """Test filtering recipes by maximum cook time."""
        # Arrange
        recipe_factory(name='Quick Recipe', prep_time=10, cook_time=15)
        recipe_factory(name='Slow Recipe', prep_time=20, cook_time=120)

        # Act
        response = api_client.get('/api/recipes/', {'max_cook_time': '30'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Quick Recipe'

    def test_filter_by_both_prep_and_cook_time(self, api_client, recipe_factory):
        """Test filtering by both prep and cook time simultaneously."""
        # Arrange
        recipe_factory(name='Very Quick', prep_time=5, cook_time=10)
        recipe_factory(name='Medium Speed', prep_time=20, cook_time=25)
        recipe_factory(name='Very Slow', prep_time=60, cook_time=120)

        # Act
        response = api_client.get('/api/recipes/', {
            'max_prep_time': '30',
            'max_cook_time': '30'
        })

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        recipe_names = [r['name'] for r in response.data]
        assert 'Very Quick' in recipe_names
        assert 'Medium Speed' in recipe_names


class TestRecipeIngredientFilters:
    """Tests for filtering recipes by ingredients."""

    def test_filter_by_include_ingredient(self, api_client, recipe_with_ingredients_factory):
        """Test filtering recipes that include a specific ingredient."""
        # Arrange
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Chicken Soup'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Carrots', 'measurement': '2 cups', 'order': 1}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Beef Stew'},
            ingredient_kwargs_list=[
                {'name': 'Beef', 'measurement': '1 lb', 'order': 0},
                {'name': 'Potatoes', 'measurement': '3 cups', 'order': 1}
            ]
        )

        # Act
        response = api_client.get('/api/recipes/', {'include_ingredients': 'Chicken'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Chicken Soup'

    def test_filter_by_exclude_ingredient(self, api_client, recipe_with_ingredients_factory):
        """Test filtering recipes that exclude a specific ingredient."""
        # Arrange
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Chicken with Mushrooms'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Mushrooms', 'measurement': '1 cup', 'order': 1}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Plain Chicken'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Herbs', 'measurement': '1 tsp', 'order': 1}
            ]
        )

        # Act
        response = api_client.get('/api/recipes/', {'exclude_ingredients': 'Mushrooms'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Plain Chicken'

    def test_filter_by_include_and_exclude_ingredients(self, api_client, recipe_with_ingredients_factory):
        """Test filtering with both include and exclude ingredient filters."""
        # Arrange
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Chicken with Mushrooms'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Mushrooms', 'measurement': '1 cup', 'order': 1}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Chicken without Mushrooms'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Carrots', 'measurement': '2 cups', 'order': 1}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Beef with Mushrooms'},
            ingredient_kwargs_list=[
                {'name': 'Beef', 'measurement': '1 lb', 'order': 0},
                {'name': 'Mushrooms', 'measurement': '1 cup', 'order': 1}
            ]
        )

        # Act
        response = api_client.get('/api/recipes/', {
            'include_ingredients': 'Chicken',
            'exclude_ingredients': 'Mushrooms'
        })

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Chicken without Mushrooms'

    def test_filter_by_multiple_include_ingredients(self, api_client, recipe_with_ingredients_factory):
        """Test filtering by multiple ingredients that must be included."""
        # Arrange
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Chicken and Rice'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0},
                {'name': 'Rice', 'measurement': '2 cups', 'order': 1}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={'name': 'Just Chicken'},
            ingredient_kwargs_list=[
                {'name': 'Chicken', 'measurement': '1 lb', 'order': 0}
            ]
        )

        # Act
        response = api_client.get('/api/recipes/', {'include_ingredients': 'Chicken,Rice'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Chicken and Rice'


class TestRecipeDietaryTagsFilters:
    """Tests for filtering recipes by dietary tags."""

    def test_filter_by_single_dietary_tag(self, api_client, recipe_factory):
        """Test filtering recipes by a single dietary tag."""
        # Arrange
        recipe_factory(name='Vegan Recipe', dietary_tags=['vegan'])
        recipe_factory(name='Non-Vegan Recipe', dietary_tags=[])

        # Act
        response = api_client.get('/api/recipes/', {'dietary_tags': 'vegan'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Vegan Recipe'

    def test_filter_by_multiple_dietary_tags(self, api_client, recipe_factory):
        """Test filtering recipes by multiple dietary tags."""
        # Arrange
        recipe_factory(name='Vegan and Gluten-Free', dietary_tags=['vegan', 'gluten_free'])
        recipe_factory(name='Just Vegan', dietary_tags=['vegan'])
        recipe_factory(name='Just Gluten-Free', dietary_tags=['gluten_free'])
        recipe_factory(name='Neither', dietary_tags=[])

        # Act
        response = api_client.get('/api/recipes/', {'dietary_tags': 'vegan,gluten_free'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Vegan and Gluten-Free'

    def test_dietary_tags_with_empty_list_not_returned(self, api_client, recipe_factory):
        """Test that recipes without dietary tags are not returned when filtering."""
        # Arrange
        recipe_factory(name='No Tags', dietary_tags=[])
        recipe_factory(name='With Tags', dietary_tags=['keto'])

        # Act
        response = api_client.get('/api/recipes/', {'dietary_tags': 'keto'})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'With Tags'


class TestRecipeMultipleFilters:
    """Tests for combining multiple filters simultaneously."""

    def test_search_with_difficulty_filter(self, api_client, recipe_factory):
        """Test combining search with difficulty filter."""
        # Arrange
        recipe_factory(name='Easy Cake', difficulty='easy')
        recipe_factory(name='Hard Cake', difficulty='hard')
        recipe_factory(name='Easy Bread', difficulty='easy')

        # Act
        response = api_client.get('/api/recipes/', {
            'search': 'Cake',
            'difficulty': 'easy'
        })

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Easy Cake'

    def test_all_filters_combined(self, api_client, recipe_with_ingredients_factory):
        """Test combining all filters simultaneously."""
        # Arrange
        recipe_with_ingredients_factory(
            recipe_kwargs={
                'name': 'Quick Vegan Chicken Alternative',
                'difficulty': 'easy',
                'prep_time': 10,
                'cook_time': 15,
                'dietary_tags': ['vegan']
            },
            ingredient_kwargs_list=[
                {'name': 'Tofu', 'measurement': '1 lb', 'order': 0}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={
                'name': 'Quick Vegan Mushroom Dish',
                'difficulty': 'easy',
                'prep_time': 10,
                'cook_time': 15,
                'dietary_tags': ['vegan']
            },
            ingredient_kwargs_list=[
                {'name': 'Mushrooms', 'measurement': '2 cups', 'order': 0}
            ]
        )
        recipe_with_ingredients_factory(
            recipe_kwargs={
                'name': 'Slow Non-Vegan',
                'difficulty': 'hard',
                'prep_time': 60,
                'cook_time': 120,
                'dietary_tags': []
            },
            ingredient_kwargs_list=[
                {'name': 'Tofu', 'measurement': '1 lb', 'order': 0}
            ]
        )

        # Act
        response = api_client.get('/api/recipes/', {
            'search': 'Vegan',
            'difficulty': 'easy',
            'max_prep_time': '30',
            'max_cook_time': '30',
            'include_ingredients': 'Tofu',
            'dietary_tags': 'vegan'
        })

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Quick Vegan Chicken Alternative'
