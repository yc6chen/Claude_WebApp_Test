"""
Utility functions for recipe management, including unit conversion
and ingredient aggregation for shopping lists.
"""
import re
from decimal import Decimal, InvalidOperation
from typing import Dict, Tuple, Optional


class UnitConverter:
    """
    Handles conversion between different units of measurement
    for cooking ingredients.
    """

    # Conversion tables (all values normalized to base unit)

    # Volume conversions (base unit: cup)
    VOLUME_UNITS = {
        # Metric
        'ml': Decimal('0.00422675'),
        'milliliter': Decimal('0.00422675'),
        'milliliters': Decimal('0.00422675'),
        'l': Decimal('4.22675'),
        'liter': Decimal('4.22675'),
        'liters': Decimal('4.22675'),

        # US customary
        'tsp': Decimal('0.0208333'),
        'teaspoon': Decimal('0.0208333'),
        'teaspoons': Decimal('0.0208333'),
        'tbsp': Decimal('0.0625'),
        'tablespoon': Decimal('0.0625'),
        'tablespoons': Decimal('0.0625'),
        'fl oz': Decimal('0.125'),
        'fluid ounce': Decimal('0.125'),
        'fluid ounces': Decimal('0.125'),
        'cup': Decimal('1'),
        'cups': Decimal('1'),
        'c': Decimal('1'),
        'pint': Decimal('2'),
        'pints': Decimal('2'),
        'pt': Decimal('2'),
        'quart': Decimal('4'),
        'quarts': Decimal('4'),
        'qt': Decimal('4'),
        'gallon': Decimal('16'),
        'gallons': Decimal('16'),
        'gal': Decimal('16'),
    }

    # Weight conversions (base unit: gram)
    WEIGHT_UNITS = {
        'mg': Decimal('0.001'),
        'milligram': Decimal('0.001'),
        'milligrams': Decimal('0.001'),
        'g': Decimal('1'),
        'gram': Decimal('1'),
        'grams': Decimal('1'),
        'kg': Decimal('1000'),
        'kilogram': Decimal('1000'),
        'kilograms': Decimal('1000'),
        'oz': Decimal('28.3495'),
        'ounce': Decimal('28.3495'),
        'ounces': Decimal('28.3495'),
        'lb': Decimal('453.592'),
        'lbs': Decimal('453.592'),
        'pound': Decimal('453.592'),
        'pounds': Decimal('453.592'),
    }

    # Count/special units (cannot be converted)
    COUNT_UNITS = {
        'piece', 'pieces', 'whole', 'item', 'items',
        'clove', 'cloves', 'slice', 'slices',
        'can', 'cans', 'package', 'packages', 'pkg',
        'bunch', 'bunches', 'head', 'heads',
        'pinch', 'pinches', 'dash', 'dashes',
        'to taste', 'as needed',
    }

    @classmethod
    def normalize_unit(cls, unit: str) -> str:
        """Normalize unit string for comparison."""
        return unit.lower().strip()

    @classmethod
    def get_unit_category(cls, unit: str) -> Optional[str]:
        """
        Determine which category a unit belongs to.
        Returns: 'volume', 'weight', 'count', or None
        """
        normalized = cls.normalize_unit(unit)

        if normalized in cls.VOLUME_UNITS:
            return 'volume'
        elif normalized in cls.WEIGHT_UNITS:
            return 'weight'
        elif any(count_unit in normalized for count_unit in cls.COUNT_UNITS):
            return 'count'
        return None

    @classmethod
    def can_convert(cls, from_unit: str, to_unit: str) -> bool:
        """Check if two units can be converted between each other."""
        from_cat = cls.get_unit_category(from_unit)
        to_cat = cls.get_unit_category(to_unit)

        # Can only convert if both units are in the same category
        # and neither is a count unit
        return (from_cat == to_cat and
                from_cat is not None and
                from_cat != 'count')

    @classmethod
    def convert(cls, quantity: Decimal, from_unit: str, to_unit: str) -> Optional[Decimal]:
        """
        Convert quantity from one unit to another.
        Returns None if conversion is not possible.
        """
        from_norm = cls.normalize_unit(from_unit)
        to_norm = cls.normalize_unit(to_unit)

        # Same unit, no conversion needed
        if from_norm == to_norm:
            return quantity

        # Check if conversion is possible
        if not cls.can_convert(from_unit, to_unit):
            return None

        category = cls.get_unit_category(from_unit)

        if category == 'volume':
            # Convert to base unit (cups), then to target unit
            base_quantity = quantity * cls.VOLUME_UNITS[from_norm]
            return base_quantity / cls.VOLUME_UNITS[to_norm]

        elif category == 'weight':
            # Convert to base unit (grams), then to target unit
            base_quantity = quantity * cls.WEIGHT_UNITS[from_norm]
            return base_quantity / cls.WEIGHT_UNITS[to_norm]

        return None

    @classmethod
    def choose_best_unit(cls, quantity: Decimal, unit: str) -> Tuple[Decimal, str]:
        """
        Choose the most appropriate unit for display.
        For example, 1000g -> 1kg, 32 tbsp -> 2 cups
        """
        normalized = cls.normalize_unit(unit)
        category = cls.get_unit_category(unit)

        if category == 'volume':
            # Prefer cups for medium amounts, tbsp for small, gallons for large
            if quantity >= Decimal('16'):  # >= 1 gallon
                new_qty = cls.convert(quantity, unit, 'gallon')
                if new_qty:
                    return (new_qty, 'gallon' if new_qty > 1 else 'gallon')
            elif quantity >= Decimal('1'):  # >= 1 cup
                new_qty = cls.convert(quantity, unit, 'cup')
                if new_qty:
                    return (new_qty, 'cups' if new_qty > 1 else 'cup')
            elif quantity < Decimal('0.0625'):  # < 1 tbsp
                new_qty = cls.convert(quantity, unit, 'tsp')
                if new_qty:
                    return (new_qty, 'teaspoons' if new_qty > 1 else 'teaspoon')
            else:  # 1 tbsp to 1 cup
                new_qty = cls.convert(quantity, unit, 'tbsp')
                if new_qty:
                    return (new_qty, 'tablespoons' if new_qty > 1 else 'tablespoon')

        elif category == 'weight':
            # Prefer kg for large amounts, g for medium, oz for small
            base_grams = cls.convert(quantity, unit, 'g')
            if base_grams:
                if base_grams >= Decimal('1000'):
                    return (base_grams / Decimal('1000'), 'kg')
                elif base_grams >= Decimal('28.35'):  # ~1 oz
                    # Choose between oz and g based on original unit
                    if normalized in ['oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds']:
                        if base_grams >= Decimal('453.592'):  # >= 1 lb
                            lbs = cls.convert(quantity, unit, 'lb')
                            return (lbs, 'lbs' if lbs > 1 else 'lb')
                        else:
                            oz = cls.convert(quantity, unit, 'oz')
                            return (oz, 'oz')
                    else:
                        return (base_grams, 'g')
                else:
                    return (base_grams, 'g')

        # Default: return as-is
        return (quantity, unit)


class IngredientParser:
    """
    Parses ingredient measurement strings into quantity and unit.
    """

    # Common patterns for ingredient measurements
    PATTERNS = [
        # "2 cups", "1.5 tablespoons", "3/4 cup"
        r'^(\d+(?:\.\d+)?|\d+/\d+)\s*(.+)$',
        # "1 1/2 cups" (mixed number)
        r'^(\d+)\s+(\d+/\d+)\s*(.+)$',
    ]

    @classmethod
    def parse_measurement(cls, measurement: str) -> Tuple[Decimal, str]:
        """
        Parse a measurement string into quantity and unit.
        Returns: (quantity as Decimal, unit as string)

        Examples:
            "2 cups" -> (Decimal('2'), "cups")
            "1.5 tablespoons" -> (Decimal('1.5'), "tablespoons")
            "1/2 cup" -> (Decimal('0.5'), "cup")
            "1 1/2 cups" -> (Decimal('1.5'), "cups")
        """
        measurement = measurement.strip()

        # Try mixed number pattern first (e.g., "1 1/2 cups")
        mixed_pattern = r'^(\d+)\s+(\d+)/(\d+)\s*(.+)$'
        match = re.match(mixed_pattern, measurement)
        if match:
            whole = Decimal(match.group(1))
            numerator = Decimal(match.group(2))
            denominator = Decimal(match.group(3))
            unit = match.group(4).strip()
            quantity = whole + (numerator / denominator)
            return (quantity, unit)

        # Try simple fraction pattern (e.g., "1/2 cup")
        fraction_pattern = r'^(\d+)/(\d+)\s*(.+)$'
        match = re.match(fraction_pattern, measurement)
        if match:
            numerator = Decimal(match.group(1))
            denominator = Decimal(match.group(2))
            unit = match.group(3).strip()
            quantity = numerator / denominator
            return (quantity, unit)

        # Try decimal or whole number pattern (e.g., "2 cups", "1.5 tablespoons")
        simple_pattern = r'^(\d+(?:\.\d+)?)\s*(.+)$'
        match = re.match(simple_pattern, measurement)
        if match:
            quantity = Decimal(match.group(1))
            unit = match.group(2).strip()
            return (quantity, unit)

        # If no pattern matches, try to extract just a number at the start
        number_pattern = r'^(\d+(?:\.\d+)?)'
        match = re.match(number_pattern, measurement)
        if match:
            quantity = Decimal(match.group(1))
            # Rest is the unit
            unit = measurement[len(match.group(1)):].strip()
            return (quantity, unit if unit else 'piece')

        # Default: assume quantity is 1 and entire string is the unit/description
        return (Decimal('1'), measurement)

    @classmethod
    def extract_ingredient_name(cls, full_name: str) -> str:
        """
        Extract the core ingredient name, removing qualifiers.
        E.g., "fresh basil leaves" -> "basil"
        """
        # Common qualifiers to remove
        qualifiers = [
            'fresh', 'dried', 'frozen', 'canned', 'chopped', 'diced',
            'minced', 'sliced', 'grated', 'shredded', 'crushed', 'ground',
            'whole', 'halved', 'quartered', 'peeled', 'deveined',
            'boneless', 'skinless', 'organic', 'raw', 'cooked',
        ]

        words = full_name.lower().split()
        filtered_words = [w for w in words if w not in qualifiers]

        return ' '.join(filtered_words) if filtered_words else full_name


class IngredientAggregator:
    """
    Aggregates ingredients from multiple recipes, handling unit conversion
    and combining like ingredients.
    """

    @classmethod
    def aggregate_ingredients(cls, ingredients_list) -> Dict[str, Dict]:
        """
        Aggregate ingredients from multiple sources.

        Args:
            ingredients_list: List of ingredient objects with name and measurement

        Returns:
            Dict mapping ingredient name to aggregated data:
            {
                'ingredient_name': {
                    'quantity': Decimal,
                    'unit': str,
                    'source_recipes': [recipe_ids],
                    'category': str
                }
            }
        """
        aggregated = {}

        for ingredient in ingredients_list:
            # Parse the measurement
            try:
                quantity, unit = IngredientParser.parse_measurement(ingredient.measurement)
            except (InvalidOperation, ValueError, ZeroDivisionError):
                # If parsing fails, store as-is
                quantity = Decimal('1')
                unit = ingredient.measurement

            # Normalize ingredient name
            ingredient_name = ingredient.name.lower().strip()

            # Check if this ingredient already exists
            if ingredient_name in aggregated:
                existing = aggregated[ingredient_name]
                existing_qty = existing['quantity']
                existing_unit = existing['unit']

                # Try to convert and add quantities
                if UnitConverter.can_convert(unit, existing_unit):
                    # Convert to existing unit and add
                    converted_qty = UnitConverter.convert(quantity, unit, existing_unit)
                    if converted_qty:
                        existing['quantity'] += converted_qty
                    else:
                        # Conversion failed, keep original unit
                        existing['quantity'] += quantity
                elif UnitConverter.normalize_unit(unit) == UnitConverter.normalize_unit(existing_unit):
                    # Same unit, just add
                    existing['quantity'] += quantity
                else:
                    # Can't convert, append unit to note
                    if 'notes' not in existing:
                        existing['notes'] = []
                    existing['notes'].append(f"+ {quantity} {unit}")

                # Add source recipe if provided
                if hasattr(ingredient, 'recipe_id'):
                    if ingredient.recipe_id not in existing['source_recipes']:
                        existing['source_recipes'].append(ingredient.recipe_id)
            else:
                # New ingredient
                aggregated[ingredient_name] = {
                    'quantity': quantity,
                    'unit': unit,
                    'source_recipes': [ingredient.recipe_id] if hasattr(ingredient, 'recipe_id') else [],
                    'category': cls.categorize_ingredient(ingredient_name),
                    'original_name': ingredient.name,  # Keep original capitalization
                }

        # Optimize units for all ingredients
        for ingredient_name, data in aggregated.items():
            optimized_qty, optimized_unit = UnitConverter.choose_best_unit(
                data['quantity'],
                data['unit']
            )
            data['quantity'] = optimized_qty
            data['unit'] = optimized_unit

        return aggregated

    @classmethod
    def categorize_ingredient(cls, ingredient_name: str) -> str:
        """
        Categorize an ingredient based on its name.
        Returns one of the ShoppingListItem.CATEGORY_CHOICES.
        """
        name_lower = ingredient_name.lower()

        # Produce
        produce_keywords = [
            'tomato', 'lettuce', 'spinach', 'kale', 'carrot', 'celery', 'onion',
            'garlic', 'potato', 'pepper', 'cucumber', 'zucchini', 'squash',
            'broccoli', 'cauliflower', 'cabbage', 'mushroom', 'avocado',
            'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'berries',
            'basil', 'cilantro', 'parsley', 'mint', 'thyme', 'rosemary',
        ]

        # Dairy
        dairy_keywords = [
            'milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream',
            'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan',
            'egg', 'eggs',
        ]

        # Meat
        meat_keywords = [
            'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon',
            'tuna', 'shrimp', 'bacon', 'sausage', 'ham', 'steak', 'ground meat',
        ]

        # Pantry
        pantry_keywords = [
            'flour', 'sugar', 'salt', 'rice', 'pasta', 'oil', 'vinegar',
            'honey', 'syrup', 'baking powder', 'baking soda', 'yeast',
            'cornstarch', 'cocoa', 'chocolate', 'vanilla', 'almond extract',
        ]

        # Canned
        canned_keywords = [
            'canned', 'can of', 'tomato paste', 'tomato sauce', 'broth', 'stock',
            'beans', 'chickpeas', 'corn',
        ]

        # Condiments
        condiment_keywords = [
            'sauce', 'ketchup', 'mustard', 'mayonnaise', 'salsa', 'dressing',
            'soy sauce', 'hot sauce', 'bbq sauce', 'worcestershire',
        ]

        # Spices
        spice_keywords = [
            'pepper', 'paprika', 'cumin', 'oregano', 'basil', 'cinnamon',
            'nutmeg', 'ginger', 'turmeric', 'curry', 'chili powder', 'cayenne',
            'garlic powder', 'onion powder',
        ]

        # Frozen
        frozen_keywords = [
            'frozen', 'ice cream',
        ]

        # Bakery
        bakery_keywords = [
            'bread', 'roll', 'bun', 'bagel', 'croissant', 'tortilla', 'pita',
        ]

        # Beverages
        beverage_keywords = [
            'juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer',
        ]

        # Check each category
        if any(keyword in name_lower for keyword in produce_keywords):
            return 'produce'
        elif any(keyword in name_lower for keyword in dairy_keywords):
            return 'dairy'
        elif any(keyword in name_lower for keyword in meat_keywords):
            return 'meat'
        elif any(keyword in name_lower for keyword in canned_keywords):
            return 'canned'
        elif any(keyword in name_lower for keyword in condiment_keywords):
            return 'condiments'
        elif any(keyword in name_lower for keyword in spice_keywords):
            return 'spices'
        elif any(keyword in name_lower for keyword in frozen_keywords):
            return 'frozen'
        elif any(keyword in name_lower for keyword in bakery_keywords):
            return 'bakery'
        elif any(keyword in name_lower for keyword in beverage_keywords):
            return 'beverages'
        elif any(keyword in name_lower for keyword in pantry_keywords):
            return 'pantry'

        # Default category
        return 'other'
