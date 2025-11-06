from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Recipe(models.Model):
    """
    Recipe model stores cooking recipes with timing and difficulty information.
    Follows PostgreSQL best practices with proper constraints and indexes.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    CATEGORY_CHOICES = [
        ('appetizers', 'Appetizers'),
        ('baking_bread', 'Baking and Bread'),
        ('breakfast', 'Breakfast'),
        ('desserts', 'Desserts'),
        ('dinner', 'Dinner'),
        ('drinks', 'Drinks'),
        ('international', 'International'),
        ('lunch', 'Lunch'),
    ]

    DIETARY_TAG_CHOICES = [
        ('vegan', 'Vegan'),
        ('vegetarian', 'Vegetarian'),
        ('gluten_free', 'Gluten-Free'),
        ('dairy_free', 'Dairy-Free'),
        ('nut_free', 'Nut-Free'),
        ('low_carb', 'Low-Carb'),
        ('keto', 'Keto'),
        ('paleo', 'Paleo'),
        ('halal', 'Halal'),
        ('kosher', 'Kosher'),
    ]

    # Owner field - links recipe to user
    owner = models.ForeignKey(
        User,
        related_name='recipes',
        on_delete=models.CASCADE,
        null=True,  # Allow existing recipes without owner
        blank=True,
        help_text="Recipe owner"
    )

    # Privacy control
    is_private = models.BooleanField(
        default=False,
        db_index=True,
        help_text="If True, only the owner can view this recipe"
    )

    # Core fields with constraints
    name = models.CharField(
        max_length=200,
        db_index=True,  # Index for search/filter operations
        help_text="Name of the recipe"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the recipe"
    )

    # Category with database-level constraint
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='dinner',
        db_index=True,  # Index for filtering by category
        help_text="Recipe category"
    )

    # Time fields with validation constraints
    prep_time = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10080)],  # Max 1 week in minutes
        help_text="Preparation time in minutes (0-10080)"
    )
    cook_time = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10080)],  # Max 1 week in minutes
        help_text="Cooking time in minutes (0-10080)"
    )

    # Difficulty with database-level constraint
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='easy',
        db_index=True,  # Index for filtering by difficulty
        help_text="Recipe difficulty level"
    )

    # Dietary tags field (multiple tags supported)
    dietary_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="List of dietary tags (e.g., vegan, gluten-free)"
    )

    # Timestamp fields with indexes for time-series queries
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,  # Index for time-based queries
        help_text="Timestamp when recipe was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when recipe was last updated"
    )

    class Meta:
        ordering = ['category', '-created_at']
        indexes = [
            # Composite index for common query patterns
            models.Index(fields=['category', '-created_at'], name='recipe_category_created_idx'),
            models.Index(fields=['-created_at', 'difficulty'], name='recipe_created_diff_idx'),
            models.Index(fields=['name', 'difficulty'], name='recipe_name_diff_idx'),
            # Index for owner queries
            models.Index(fields=['owner', '-created_at'], name='recipe_owner_created_idx'),
            # Index for privacy filtering
            models.Index(fields=['is_private', 'owner'], name='recipe_privacy_owner_idx'),
        ]
        # Database-level constraints
        constraints = [
            models.CheckConstraint(
                check=models.Q(prep_time__gte=0),
                name='recipe_prep_time_positive'
            ),
            models.CheckConstraint(
                check=models.Q(cook_time__gte=0),
                name='recipe_cook_time_positive'
            ),
            models.CheckConstraint(
                check=models.Q(difficulty__in=['easy', 'medium', 'hard']),
                name='recipe_difficulty_valid'
            ),
            models.CheckConstraint(
                check=models.Q(category__in=[
                    'appetizers', 'baking_bread', 'breakfast', 'desserts',
                    'dinner', 'drinks', 'international', 'lunch'
                ]),
                name='recipe_category_valid'
            ),
        ]
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"
        db_table = "recipes_recipe"  # Explicit table name

    def __str__(self):
        return self.name

    @property
    def total_time(self):
        """Calculate total time (prep + cook) in minutes."""
        return self.prep_time + self.cook_time


class Ingredient(models.Model):
    """
    Ingredient model stores recipe ingredients with measurements.
    Maintains referential integrity with Recipe through foreign key.
    """
    # Foreign key with explicit CASCADE behavior
    recipe = models.ForeignKey(
        Recipe,
        related_name='ingredients',
        on_delete=models.CASCADE,  # Delete ingredients when recipe is deleted
        db_index=True,  # Index for join operations
        help_text="Associated recipe"
    )

    # Ingredient details
    name = models.CharField(
        max_length=200,
        db_index=True,  # Index for ingredient search
        help_text="Ingredient name"
    )
    measurement = models.CharField(
        max_length=100,
        help_text="Measurement quantity and unit (e.g., '2 cups', '100g')"
    )

    # Order field for maintaining ingredient sequence
    order = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Display order of ingredient in list"
    )

    class Meta:
        ordering = ['order', 'id']  # Secondary sort by id for stability
        indexes = [
            # Composite index for recipe ingredient retrieval
            models.Index(fields=['recipe', 'order'], name='ingredient_recipe_order_idx'),
        ]
        # Ensure order is non-negative at database level
        constraints = [
            models.CheckConstraint(
                check=models.Q(order__gte=0),
                name='ingredient_order_positive'
            ),
        ]
        verbose_name = "Ingredient"
        verbose_name_plural = "Ingredients"
        db_table = "recipes_ingredient"  # Explicit table name

    def __str__(self):
        return f"{self.measurement} {self.name}"


class UserProfile(models.Model):
    """
    Extended user profile with additional information.
    One-to-one relationship with Django's built-in User model.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        help_text="Associated user account"
    )

    bio = models.TextField(
        blank=True,
        max_length=500,
        help_text="User biography"
    )

    avatar = models.URLField(
        blank=True,
        help_text="URL to user's avatar image"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Profile creation timestamp"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Profile last update timestamp"
    )

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        db_table = "recipes_userprofile"

    def __str__(self):
        return f"Profile for {self.user.username}"


class Favorite(models.Model):
    """
    Favorite model to track user's favorite recipes.
    Many-to-many relationship between User and Recipe through this model.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites',
        help_text="User who favorited the recipe"
    )

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        help_text="Favorited recipe"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the recipe was favorited"
    )

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'recipe']  # Prevent duplicate favorites
        indexes = [
            models.Index(fields=['user', '-created_at'], name='favorite_user_created_idx'),
            models.Index(fields=['recipe', '-created_at'], name='favorite_recipe_created_idx'),
        ]
        verbose_name = "Favorite"
        verbose_name_plural = "Favorites"
        db_table = "recipes_favorite"

    def __str__(self):
        return f"{self.user.username} favorites {self.recipe.name}"


class MealPlan(models.Model):
    """
    MealPlan model stores user's planned meals for specific dates and meal types.
    Supports multiple recipes per day and meal type.
    """
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='meal_plans',
        db_index=True,
        help_text="User who created this meal plan"
    )

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='meal_plans',
        null=True,
        blank=True,
        help_text="Recipe assigned to this meal slot (null for empty slot)"
    )

    date = models.DateField(
        db_index=True,
        help_text="Date for this meal"
    )

    meal_type = models.CharField(
        max_length=10,
        choices=MEAL_TYPE_CHOICES,
        db_index=True,
        help_text="Type of meal (breakfast, lunch, dinner)"
    )

    order = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Order when multiple recipes are assigned to same meal"
    )

    notes = models.TextField(
        blank=True,
        max_length=500,
        help_text="Optional notes for this meal"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this meal plan entry was created"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this meal plan entry was last updated"
    )

    class Meta:
        ordering = ['date', 'meal_type', 'order']
        indexes = [
            models.Index(fields=['user', 'date'], name='mealplan_user_date_idx'),
            models.Index(fields=['user', 'date', 'meal_type'], name='mealplan_user_date_meal_idx'),
            models.Index(fields=['date', 'meal_type', 'order'], name='mealplan_date_meal_order_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(meal_type__in=['breakfast', 'lunch', 'dinner']),
                name='mealplan_meal_type_valid'
            ),
            models.CheckConstraint(
                check=models.Q(order__gte=0),
                name='mealplan_order_positive'
            ),
        ]
        verbose_name = "Meal Plan"
        verbose_name_plural = "Meal Plans"
        db_table = "recipes_mealplan"

    def __str__(self):
        recipe_name = self.recipe.name if self.recipe else "Empty"
        return f"{self.user.username} - {self.date} {self.meal_type}: {recipe_name}"


class ShoppingList(models.Model):
    """
    ShoppingList model represents a shopping list generated from meal plans.
    One shopping list can consolidate items from multiple meal plans.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shopping_lists',
        db_index=True,
        help_text="User who owns this shopping list"
    )

    name = models.CharField(
        max_length=200,
        help_text="Name of the shopping list (e.g., 'Week of Jan 1-7')"
    )

    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Start date of meal plan period"
    )

    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="End date of meal plan period"
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this shopping list is currently active"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When this shopping list was created"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this shopping list was last updated"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='shoppinglist_user_created_idx'),
            models.Index(fields=['user', 'is_active'], name='shoppinglist_user_active_idx'),
        ]
        verbose_name = "Shopping List"
        verbose_name_plural = "Shopping Lists"
        db_table = "recipes_shoppinglist"

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class ShoppingListItem(models.Model):
    """
    ShoppingListItem model stores individual items in a shopping list.
    Items can be aggregated from multiple recipes or added manually.
    """
    CATEGORY_CHOICES = [
        ('produce', 'Produce'),
        ('dairy', 'Dairy & Eggs'),
        ('meat', 'Meat & Seafood'),
        ('bakery', 'Bakery'),
        ('pantry', 'Pantry'),
        ('canned', 'Canned Goods'),
        ('frozen', 'Frozen'),
        ('beverages', 'Beverages'),
        ('condiments', 'Condiments & Sauces'),
        ('spices', 'Spices & Seasonings'),
        ('snacks', 'Snacks'),
        ('other', 'Other'),
    ]

    shopping_list = models.ForeignKey(
        ShoppingList,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
        help_text="Shopping list this item belongs to"
    )

    ingredient_name = models.CharField(
        max_length=200,
        db_index=True,
        help_text="Name of the ingredient"
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Quantity of the ingredient"
    )

    unit = models.CharField(
        max_length=50,
        help_text="Unit of measurement (e.g., 'cups', 'lbs', 'oz', 'grams')"
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='other',
        db_index=True,
        help_text="Category for organizing shopping list"
    )

    is_checked = models.BooleanField(
        default=False,
        help_text="Whether this item has been checked off the list"
    )

    source_recipes = models.JSONField(
        default=list,
        blank=True,
        help_text="List of recipe IDs that contributed to this item"
    )

    is_custom = models.BooleanField(
        default=False,
        help_text="True if manually added, False if from recipes"
    )

    notes = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional notes for this item"
    )

    order = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Display order within category"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this item was added"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this item was last updated"
    )

    class Meta:
        ordering = ['category', 'order', 'ingredient_name']
        indexes = [
            models.Index(fields=['shopping_list', 'category'], name='shopitem_list_category_idx'),
            models.Index(fields=['shopping_list', 'is_checked'], name='shopitem_list_checked_idx'),
            models.Index(fields=['category', 'order'], name='shopitem_cat_order_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gte=0),
                name='shoppingitem_quantity_positive'
            ),
            models.CheckConstraint(
                check=models.Q(order__gte=0),
                name='shoppingitem_order_positive'
            ),
        ]
        verbose_name = "Shopping List Item"
        verbose_name_plural = "Shopping List Items"
        db_table = "recipes_shoppinglistitem"

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient_name}"
