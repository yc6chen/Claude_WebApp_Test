from django.contrib import admin
from .models import Recipe, Ingredient


class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['name', 'difficulty', 'prep_time', 'cook_time', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['name', 'description']
    inlines = [IngredientInline]


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'measurement', 'recipe', 'order']
    list_filter = ['recipe']
    search_fields = ['name']
