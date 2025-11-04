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
