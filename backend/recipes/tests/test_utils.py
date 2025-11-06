"""
Tests for utility modules (UnitConverter, IngredientParser, IngredientAggregator)
"""
import pytest
from decimal import Decimal
from recipes.utils import UnitConverter, IngredientParser, IngredientAggregator
from recipes.models import Ingredient, Recipe
from django.contrib.auth.models import User


class TestUnitConverter:
    """Test UnitConverter functionality"""

    def test_normalize_unit(self):
        """Test unit normalization"""
        assert UnitConverter.normalize_unit('Cup') == 'cup'
        assert UnitConverter.normalize_unit('  TBSP  ') == 'tbsp'

    def test_get_unit_category(self):
        """Test unit category detection"""
        assert UnitConverter.get_unit_category('cup') == 'volume'
        assert UnitConverter.get_unit_category('lbs') == 'weight'
        assert UnitConverter.get_unit_category('piece') == 'count'
        assert UnitConverter.get_unit_category('unknown') is None

    def test_can_convert_same_category(self):
        """Test conversion compatibility check"""
        assert UnitConverter.can_convert('cup', 'tablespoon') is True
        assert UnitConverter.can_convert('oz', 'lbs') is True
        assert UnitConverter.can_convert('cup', 'lbs') is False

    def test_volume_conversions(self):
        """Test volume unit conversions"""
        # 1 cup = 16 tablespoons
        result = UnitConverter.convert(Decimal('1'), 'cup', 'tablespoon')
        assert result == Decimal('16')

        # 4 cups = 1 quart
        result = UnitConverter.convert(Decimal('4'), 'cup', 'quart')
        assert result == Decimal('1')

        # 3 teaspoons = 1 tablespoon (allow small rounding error)
        result = UnitConverter.convert(Decimal('3'), 'teaspoon', 'tablespoon')
        assert abs(result - Decimal('1')) < Decimal('0.001')

    def test_weight_conversions(self):
        """Test weight unit conversions"""
        # 1000 grams = 1 kilogram
        result = UnitConverter.convert(Decimal('1000'), 'g', 'kg')
        assert result == Decimal('1')

        # 16 oz = 1 lb
        result = UnitConverter.convert(Decimal('16'), 'oz', 'lb')
        assert abs(result - Decimal('1')) < Decimal('0.01')

    def test_same_unit_conversion(self):
        """Test converting same unit returns original quantity"""
        result = UnitConverter.convert(Decimal('5'), 'cup', 'cup')
        assert result == Decimal('5')

    def test_incompatible_units(self):
        """Test that incompatible units return None"""
        result = UnitConverter.convert(Decimal('1'), 'cup', 'lbs')
        assert result is None

    def test_choose_best_unit_volume(self):
        """Test smart unit selection for volume"""
        # Large amount should use gallons
        qty, unit = UnitConverter.choose_best_unit(Decimal('20'), 'cup')
        assert unit == 'gallon'
        assert qty == Decimal('1.25')

        # Small amount should use teaspoons
        qty, unit = UnitConverter.choose_best_unit(Decimal('0.05'), 'cup')
        assert 'teaspoon' in unit

    def test_choose_best_unit_weight(self):
        """Test smart unit selection for weight"""
        # Large amount should use kg
        qty, unit = UnitConverter.choose_best_unit(Decimal('1500'), 'g')
        assert unit == 'kg'
        assert qty == Decimal('1.5')


class TestIngredientParser:
    """Test IngredientParser functionality"""

    def test_parse_simple_measurement(self):
        """Test parsing simple measurements"""
        qty, unit = IngredientParser.parse_measurement('2 cups')
        assert qty == Decimal('2')
        assert unit == 'cups'

    def test_parse_decimal_measurement(self):
        """Test parsing decimal measurements"""
        qty, unit = IngredientParser.parse_measurement('1.5 tablespoons')
        assert qty == Decimal('1.5')
        assert unit == 'tablespoons'

    def test_parse_fraction_measurement(self):
        """Test parsing fraction measurements"""
        qty, unit = IngredientParser.parse_measurement('1/2 cup')
        assert qty == Decimal('0.5')
        assert unit == 'cup'

    def test_parse_mixed_number_measurement(self):
        """Test parsing mixed number measurements"""
        qty, unit = IngredientParser.parse_measurement('1 1/2 cups')
        assert qty == Decimal('1.5')
        assert unit == 'cups'

    def test_parse_measurement_no_unit(self):
        """Test parsing measurement without explicit unit"""
        qty, unit = IngredientParser.parse_measurement('3')
        assert qty == Decimal('3')
        assert unit == 'piece'

    def test_extract_ingredient_name(self):
        """Test extracting core ingredient name"""
        name = IngredientParser.extract_ingredient_name('fresh chopped tomatoes')
        assert 'tomatoes' in name
        assert 'fresh' not in name
        assert 'chopped' not in name


@pytest.mark.django_db
class TestIngredientAggregator:
    """Test IngredientAggregator functionality"""

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username='testuser', password='test123')

    @pytest.fixture
    def recipe1(self, user):
        recipe = Recipe.objects.create(
            owner=user,
            name='Recipe 1',
            category='dinner',
            prep_time=10,
            cook_time=20,
            difficulty='easy'
        )
        return recipe

    @pytest.fixture
    def recipe2(self, user):
        recipe = Recipe.objects.create(
            owner=user,
            name='Recipe 2',
            category='lunch',
            prep_time=5,
            cook_time=15,
            difficulty='easy'
        )
        return recipe

    def test_aggregate_same_ingredients(self, recipe1, recipe2):
        """Test aggregating same ingredients from different recipes"""
        # Create ingredients
        ing1 = Ingredient.objects.create(
            recipe=recipe1,
            name='Flour',
            measurement='2 cups',
            order=0
        )
        ing1.recipe_id = recipe1.id

        ing2 = Ingredient.objects.create(
            recipe=recipe2,
            name='Flour',
            measurement='1 cup',
            order=0
        )
        ing2.recipe_id = recipe2.id

        result = IngredientAggregator.aggregate_ingredients([ing1, ing2])

        assert 'flour' in result
        assert result['flour']['quantity'] == Decimal('3')
        assert result['flour']['unit'] == 'cups'
        assert len(result['flour']['source_recipes']) == 2

    def test_aggregate_with_unit_conversion(self, recipe1, recipe2):
        """Test aggregating ingredients with unit conversion"""
        ing1 = Ingredient.objects.create(
            recipe=recipe1,
            name='Milk',
            measurement='2 cups',
            order=0
        )
        ing1.recipe_id = recipe1.id

        ing2 = Ingredient.objects.create(
            recipe=recipe2,
            name='Milk',
            measurement='8 tablespoons',
            order=0
        )
        ing2.recipe_id = recipe2.id

        result = IngredientAggregator.aggregate_ingredients([ing1, ing2])

        assert 'milk' in result
        # 2 cups + 8 tbsp (0.5 cups) = 2.5 cups
        assert result['milk']['quantity'] == Decimal('2.5')
        assert result['milk']['unit'] == 'cups'

    def test_categorize_ingredient(self):
        """Test ingredient categorization"""
        assert IngredientAggregator.categorize_ingredient('tomato') == 'produce'
        assert IngredientAggregator.categorize_ingredient('milk') == 'dairy'
        assert IngredientAggregator.categorize_ingredient('chicken') == 'meat'
        assert IngredientAggregator.categorize_ingredient('pasta') == 'pantry'
        assert IngredientAggregator.categorize_ingredient('canned beans') == 'canned'
        assert IngredientAggregator.categorize_ingredient('unknown item') == 'other'

    def test_aggregate_different_ingredients(self, recipe1):
        """Test aggregating different ingredients"""
        ing1 = Ingredient.objects.create(
            recipe=recipe1,
            name='Flour',
            measurement='2 cups',
            order=0
        )
        ing1.recipe_id = recipe1.id

        ing2 = Ingredient.objects.create(
            recipe=recipe1,
            name='Sugar',
            measurement='1 cup',
            order=1
        )
        ing2.recipe_id = recipe1.id

        result = IngredientAggregator.aggregate_ingredients([ing1, ing2])

        assert len(result) == 2
        assert 'flour' in result
        assert 'sugar' in result

    def test_aggregate_preserves_original_name(self, recipe1):
        """Test that aggregation preserves original capitalization"""
        ing = Ingredient.objects.create(
            recipe=recipe1,
            name='Fresh Basil',
            measurement='2 tablespoons',
            order=0
        )
        ing.recipe_id = recipe1.id

        result = IngredientAggregator.aggregate_ingredients([ing])

        assert 'fresh basil' in result  # Normalized key
        assert result['fresh basil']['original_name'] == 'Fresh Basil'  # Original preserved

    def test_aggregate_empty_list(self):
        """Test aggregating empty ingredient list"""
        result = IngredientAggregator.aggregate_ingredients([])
        assert result == {}
