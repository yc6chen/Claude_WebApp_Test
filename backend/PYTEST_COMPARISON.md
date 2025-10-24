# Pytest Test Suite: Before vs After

This document shows side-by-side comparisons of test improvements based on pytest best practices.

## 1. Fixture Usage

### ❌ Before: Static Fixtures
```python
@pytest.fixture
def sample_recipe_data():
    return {
        'name': 'Chocolate Chip Cookies',
        'prep_time': 15,
        'cook_time': 12,
    }

# In test - can't easily customize
def test_something(sample_recipe_data):
    # Stuck with fixed values
    recipe = Recipe.objects.create(**sample_recipe_data)

    # If I need different values, create new fixture or modify dict
    data = sample_recipe_data.copy()
    data['name'] = 'Different Name'  # Awkward
```

### ✅ After: Factory Fixtures
```python
@pytest.fixture
def recipe_data_factory():
    """Factory fixture - returns a function."""
    def _create_recipe_data(**kwargs):
        defaults = {
            'name': 'Chocolate Chip Cookies',
            'prep_time': 15,
            'cook_time': 12,
        }
        defaults.update(kwargs)
        return defaults
    return _create_recipe_data

# In test - easy to customize
def test_something(recipe_data_factory):
    # Customize only what I need
    data = recipe_data_factory(name='Custom Name', prep_time=20)
    recipe = Recipe.objects.create(**data)
```

**Benefits:** Flexibility, DRY, clear intent

---

## 2. Test Organization

### ❌ Before: Monolithic Test Class
```python
@pytest.mark.django_db
@pytest.mark.unit
class TestRecipeModel:
    """Test suite for Recipe model."""

    def test_create_recipe_with_valid_data(self):
        # ...

    def test_recipe_default_values(self):
        # ...

    def test_recipe_validation(self):
        # ...

    # ... 40+ more tests in one class
```

### ✅ After: Organized by Feature
```python
class TestRecipeCreation:
    """Tests for creating Recipe instances."""

    def test_create_recipe_with_minimal_required_fields_succeeds(self):
        # ...

    def test_create_recipe_with_all_fields_succeeds(self):
        # ...

class TestRecipeDefaults:
    """Tests for Recipe model default values."""

    def test_category_defaults_to_dinner(self):
        # ...

    def test_difficulty_defaults_to_easy(self):
        # ...

class TestRecipeValidation:
    """Tests for Recipe model field validation."""
    # ...
```

**Benefits:** Better organization, easier navigation, clearer purpose

---

## 3. Test Names

### ❌ Before: Generic Names
```python
def test_create_recipe(self):
def test_defaults(self):
def test_validation(self):
def test_ingredients(self):
```

### ✅ After: Descriptive Names (test_what_when_expected)
```python
def test_create_recipe_with_minimal_required_fields_succeeds(self):
def test_category_defaults_to_dinner(self):
def test_difficulty_accepts_valid_choices(self):
def test_deleting_recipe_cascades_to_ingredients(self):
```

**Benefits:** Self-documenting, better failure messages, clear intent

---

## 4. Database Markers

### ❌ Before: Repetitive Decorators
```python
@pytest.mark.django_db
class TestRecipeModel:
    @pytest.mark.django_db
    def test_create_recipe(self):
        # ...

    @pytest.mark.django_db
    def test_update_recipe(self):
        # ...
```

### ✅ After: Autouse Fixture
```python
# In conftest.py
@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Automatically enable database access for all tests."""
    pass

# In tests - no decorator needed!
class TestRecipeModel:
    def test_create_recipe(self):
        # Database access automatically available
        recipe = Recipe.objects.create(...)
```

**Benefits:** Less boilerplate, cleaner code, consistent behavior

---

## 5. Test Setup

### ❌ Before: Repetitive Setup
```python
def test_recipe_with_ingredients(self):
    # Manual setup every time
    recipe = Recipe.objects.create(
        name='Test Recipe',
        prep_time=10,
        cook_time=20,
    )
    Ingredient.objects.create(recipe=recipe, name='Flour', measurement='2 cups')
    Ingredient.objects.create(recipe=recipe, name='Sugar', measurement='1 cup')

    # Now test...
    assert recipe.ingredients.count() == 2

def test_another_recipe_with_ingredients(self):
    # Repeat the same setup!
    recipe = Recipe.objects.create(
        name='Another Recipe',
        prep_time=15,
        cook_time=25,
    )
    Ingredient.objects.create(recipe=recipe, name='Butter', measurement='1/2 cup')
    # ...
```

### ✅ After: Factory Fixtures
```python
def test_recipe_with_ingredients(self, recipe_with_ingredients_factory):
    # Clean, focused test
    recipe = recipe_with_ingredients_factory(ingredient_count=2)

    assert recipe.ingredients.count() == 2

def test_another_recipe_with_ingredients(self, recipe_with_ingredients_factory):
    # Easy to customize
    recipe = recipe_with_ingredients_factory(
        recipe_kwargs={'name': 'Special Recipe'},
        ingredient_count=5
    )

    assert recipe.ingredients.count() == 5
```

**Benefits:** Less code, more readable, easier to maintain

---

## 6. Parametrization

### ❌ Before: Basic Parametrization
```python
@pytest.mark.parametrize('difficulty', ['easy', 'medium', 'hard'])
def test_difficulty(self, difficulty):
    # When test fails, you see: test_difficulty[easy] FAILED
    recipe = Recipe.objects.create(
        name='Test',
        prep_time=10,
        cook_time=20,
        difficulty=difficulty
    )
    assert recipe.difficulty == difficulty
```

### ✅ After: Enhanced Parametrization with IDs
```python
@pytest.mark.parametrize(
    'time_field,time_value',
    [
        ('prep_time', 0),
        ('cook_time', 0),
        ('prep_time', 10080),
        ('cook_time', 10080),
    ],
    ids=['prep_time_minimum', 'cook_time_minimum', 'prep_time_maximum', 'cook_time_maximum']
)
def test_time_fields_accept_valid_values(self, recipe_factory, time_field, time_value):
    # Clear test output: test_time_fields[prep_time_minimum] FAILED
    kwargs = {time_field: time_value}
    recipe = recipe_factory(**kwargs)
    assert getattr(recipe, time_field) == time_value
```

**Benefits:** Clear test output, better failure messages, DRY

---

## 7. Assertions

### ❌ Before: No Messages
```python
def test_defaults(self):
    recipe = Recipe.objects.create(name='Test', prep_time=10, cook_time=20)
    assert recipe.category == 'dinner'
    assert recipe.difficulty == 'easy'

    # When fails: AssertionError (not helpful!)
```

### ✅ After: Descriptive Messages
```python
def test_category_defaults_to_dinner(self, recipe_factory):
    recipe = recipe_factory()

    assert recipe.category == 'dinner', "Default category should be 'dinner'"

    # When fails: AssertionError: Default category should be 'dinner'
    #             assert 'other' == 'dinner'
```

**Benefits:** Easier debugging, self-documenting expectations

---

## 8. Test Structure (AAA Pattern)

### ❌ Before: Unclear Structure
```python
def test_something(self):
    recipe = Recipe.objects.create(name='Test', prep_time=10, cook_time=20)
    before = timezone.now()
    recipe.name = 'Updated'
    recipe.save()
    after = timezone.now()
    assert recipe.updated_at > before
    assert recipe.updated_at <= after
```

### ✅ After: Clear AAA Pattern
```python
def test_updated_at_changes_when_recipe_modified(self, recipe_factory):
    """Test that updated_at timestamp changes when recipe is updated."""
    # Arrange
    recipe = recipe_factory(name='Original Name')
    original_updated_at = recipe.updated_at

    # Act
    import time
    time.sleep(0.01)  # Ensure timestamp difference
    recipe.name = 'Updated Name'
    recipe.save()

    # Assert
    assert recipe.updated_at > original_updated_at, (
        "updated_at should be updated on save"
    )
```

**Benefits:** Clear structure, easy to understand, better documentation

---

## 9. Fixture Scoping

### ❌ Before: No Scoping (function scope everywhere)
```python
@pytest.fixture
def valid_categories():
    # Created for EVERY test (wasteful for immutable data)
    return ['appetizers', 'breakfast', 'desserts', 'dinner', ...]

def test_1(valid_categories):
    # Creates new list

def test_2(valid_categories):
    # Creates new list again

# ... 100 tests = 100 list creations
```

### ✅ After: Appropriate Scoping
```python
@pytest.fixture(scope='session')
def valid_categories():
    # Created ONCE per test session (efficient!)
    return ['appetizers', 'breakfast', 'desserts', 'dinner', ...]

def test_1(valid_categories):
    # Reuses same list

def test_2(valid_categories):
    # Reuses same list

# ... 100 tests = 1 list creation
```

**Benefits:** Performance improvement, appropriate for immutable data

---

## 10. Complex Setup

### ❌ Before: Manual Complex Setup
```python
def test_complex_scenario(self):
    # Lots of manual setup
    recipe = Recipe.objects.create(name='Test', prep_time=10, cook_time=20)

    for i in range(5):
        Ingredient.objects.create(
            recipe=recipe,
            name=f'Ingredient {i}',
            measurement=f'{i} cups',
            order=i
        )

    recipe.refresh_from_db()

    # Finally test...
    assert recipe.ingredients.count() == 5
```

### ✅ After: Composed Fixture
```python
def test_complex_scenario(self, recipe_with_ingredients_factory):
    # Simple, readable setup
    recipe = recipe_with_ingredients_factory(ingredient_count=5)

    # Focus on what matters
    assert recipe.ingredients.count() == 5
```

**Benefits:** Reusable, readable, maintainable

---

## Test Execution Comparison

### ❌ Before: Generic Output
```bash
$ pytest recipes/tests/test_models.py

recipes/tests/test_models.py::TestRecipeModel::test_create PASSED
recipes/tests/test_models.py::TestRecipeModel::test_update PASSED
recipes/tests/test_models.py::TestRecipeModel::test_delete PASSED

3 passed in 0.45s
```

### ✅ After: Descriptive Output
```bash
$ pytest recipes/tests/test_models.py

recipes/tests/test_models.py::TestRecipeCreation::test_create_recipe_with_minimal_required_fields_succeeds PASSED
recipes/tests/test_models.py::TestRecipeCreation::test_create_recipe_sets_timestamps_automatically PASSED
recipes/tests/test_models.py::TestRecipeDefaults::test_category_defaults_to_dinner PASSED
recipes/tests/test_models.py::TestRecipeDefaults::test_difficulty_defaults_to_easy PASSED
recipes/tests/test_models.py::TestRecipeValidation::test_difficulty_accepts_valid_choices[easy] PASSED
recipes/tests/test_models.py::TestRecipeValidation::test_difficulty_accepts_valid_choices[medium] PASSED
recipes/tests/test_models.py::TestRecipeValidation::test_difficulty_accepts_valid_choices[hard] PASSED
recipes/tests/test_models.py::TestRecipeValidation::test_time_fields_accept_valid_values[prep_time_minimum] PASSED

8 passed in 0.42s
```

**Benefits:** Clear test identification, better failure tracking, self-documenting

---

## Code Metrics Comparison

| Metric | Before | After |
|--------|--------|-------|
| Lines of test code | ~1200 | ~1100 |
| Fixture count | 4 | 13 |
| Test classes | 3 | 14 |
| Parametrized tests | 2 | 5 |
| Assertion messages | 0 | 50+ |
| Code duplication | High | Low |
| Test clarity | Medium | High |
| Maintainability | Medium | High |

---

## Running Tests Comparison

### ❌ Before
```bash
# Run all tests
pytest

# Run specific test - hard to remember full path
pytest recipes/tests/test_models.py::TestRecipeModel::test_recipe_validation
```

### ✅ After
```bash
# Run all tests
pytest

# Run tests by class - organized by feature
pytest recipes/tests/test_models.py::TestRecipeCreation
pytest recipes/tests/test_models.py::TestRecipeValidation

# Run tests by keyword
pytest -k "cascade"  # All cascade tests
pytest -k "factory"  # All factory tests
pytest -k "defaults" # All default tests

# Run with specific parameter
pytest recipes/tests/test_models.py::TestRecipeValidation::test_time_fields_accept_valid_values[prep_time_maximum]
```

**Benefits:** More flexible, easier to target specific tests

---

## Summary of Improvements

### Readability ✅
- Descriptive test names
- Clear AAA pattern
- Organized test classes

### Maintainability ✅
- Factory fixtures for flexibility
- Composed fixtures for complexity
- Less code duplication

### Performance ✅
- Session-scoped fixtures
- Autouse fixtures
- Efficient test setup

### Debugging ✅
- Assertion messages
- Better test output
- Clear failure messages

### Best Practices ✅
- Following pytest conventions
- Proper fixture usage
- Enhanced parametrization

---

## Migration Guide

If you want to apply these improvements to other test files:

1. **Create factory fixtures in conftest.py**
2. **Remove `@pytest.mark.django_db` decorators** (use autouse fixture)
3. **Organize tests into focused classes** by feature
4. **Rename tests** to be more descriptive
5. **Add assertion messages** for clarity
6. **Use AAA comments** in complex tests
7. **Add parametrization IDs** for clarity
8. **Create composed fixtures** for complex scenarios

---

The improved test suite is more maintainable, readable, and follows pytest best practices while maintaining the same comprehensive coverage!
