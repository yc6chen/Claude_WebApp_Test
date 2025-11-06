from django.contrib import admin
from .models import Recipe, Ingredient, UserProfile, Favorite, MealPlan, ShoppingList, ShoppingListItem


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


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'meal_type', 'recipe', 'order', 'created_at']
    list_filter = ['date', 'meal_type', 'created_at']
    search_fields = ['user__username', 'recipe__name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('user', 'date', 'meal_type', 'recipe')
        }),
        ('Details', {
            'fields': ('order', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ShoppingListItemInline(admin.TabularInline):
    model = ShoppingListItem
    extra = 0
    fields = ['ingredient_name', 'quantity', 'unit', 'category', 'is_checked', 'is_custom']


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'start_date', 'end_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ShoppingListItemInline]
    fieldsets = (
        (None, {
            'fields': ('user', 'name', 'is_active')
        }),
        ('Date Range', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = ['shopping_list', 'ingredient_name', 'quantity', 'unit', 'category', 'is_checked', 'is_custom']
    list_filter = ['category', 'is_checked', 'is_custom']
    search_fields = ['ingredient_name', 'shopping_list__name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('shopping_list', 'ingredient_name', 'quantity', 'unit', 'category')
        }),
        ('Status', {
            'fields': ('is_checked', 'is_custom', 'notes')
        }),
        ('Metadata', {
            'fields': ('source_recipes', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
