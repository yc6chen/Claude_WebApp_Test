from django.contrib import admin
from .models import Recipe, Ingredient, UserProfile, Favorite


class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_private', 'difficulty', 'prep_time', 'cook_time', 'created_at']
    list_filter = ['difficulty', 'created_at', 'category', 'is_private']
    search_fields = ['name', 'description', 'owner__username']
    inlines = [IngredientInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'category', 'owner', 'is_private')
        }),
        ('Time Information', {
            'fields': ('prep_time', 'cook_time', 'difficulty')
        }),
        ('Dietary Information', {
            'fields': ('dietary_tags',)
        }),
    )


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'measurement', 'recipe', 'order']
    list_filter = ['recipe']
    search_fields = ['name']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email', 'bio']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipe', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'recipe__name']
    readonly_fields = ['created_at']
