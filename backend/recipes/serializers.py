from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Recipe, Ingredient, UserProfile, Favorite, MealPlan, ShoppingList, ShoppingListItem


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'measurement', 'order']


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, required=False)
    dietary_tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    owner_username = serializers.CharField(source='owner.username', read_only=True, allow_null=True)
    is_favorited = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description', 'category', 'prep_time', 'cook_time',
                  'difficulty', 'dietary_tags', 'ingredients', 'owner', 'owner_username',
                  'is_private', 'is_favorited', 'favorites_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'owner']

    def get_is_favorited(self, obj):
        """Check if the current user has favorited this recipe"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, recipe=obj).exists()
        return False

    def get_favorites_count(self, obj):
        """Get the total number of favorites for this recipe"""
        return obj.favorited_by.count()

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        # Set owner to the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=recipe, **ingredient_data)

        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)

        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.category = validated_data.get('category', instance.category)
        instance.prep_time = validated_data.get('prep_time', instance.prep_time)
        instance.cook_time = validated_data.get('cook_time', instance.cook_time)
        instance.difficulty = validated_data.get('difficulty', instance.difficulty)
        instance.dietary_tags = validated_data.get('dietary_tags', instance.dietary_tags)
        instance.is_private = validated_data.get('is_private', instance.is_private)
        instance.save()

        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for ingredient_data in ingredients_data:
                Ingredient.objects.create(recipe=instance, **ingredient_data)

        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    recipe_count = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'bio', 'avatar', 'recipe_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_recipe_count(self, obj):
        return obj.user.recipes.filter(is_private=False).count()


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()

        # Create user profile
        UserProfile.objects.create(user=user)

        return user


class FavoriteSerializer(serializers.ModelSerializer):
    recipe_details = RecipeSerializer(source='recipe', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'recipe', 'recipe_details', 'created_at']
        read_only_fields = ['created_at']


class MealPlanSerializer(serializers.ModelSerializer):
    recipe_details = RecipeSerializer(source='recipe', read_only=True)
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'user', 'recipe', 'recipe_details', 'date', 'meal_type',
                  'meal_type_display', 'order', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'user']

    def create(self, validated_data):
        # Set user to the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class MealPlanBulkSerializer(serializers.Serializer):
    """Serializer for bulk operations on meal plans"""
    action = serializers.ChoiceField(choices=['clear', 'copy', 'repeat'])
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False)
    target_start_date = serializers.DateField(required=False)

    def validate(self, attrs):
        action = attrs.get('action')

        if action in ['copy', 'repeat'] and not attrs.get('target_start_date'):
            raise serializers.ValidationError({
                'target_start_date': 'This field is required for copy and repeat actions.'
            })

        if action == 'clear' and not attrs.get('end_date'):
            # For clear action, end_date defaults to start_date
            attrs['end_date'] = attrs['start_date']

        if attrs.get('end_date') and attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError({
                'end_date': 'End date must be after or equal to start date.'
            })

        return attrs


class ShoppingListItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ShoppingListItem
        fields = ['id', 'shopping_list', 'ingredient_name', 'quantity', 'unit',
                  'category', 'category_display', 'is_checked', 'source_recipes',
                  'is_custom', 'notes', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    checked_items = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingList
        fields = ['id', 'user', 'name', 'start_date', 'end_date', 'is_active',
                  'items', 'total_items', 'checked_items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'user']

    def get_total_items(self, obj):
        """Get total number of items in the shopping list"""
        return obj.items.count()

    def get_checked_items(self, obj):
        """Get number of checked items in the shopping list"""
        return obj.items.filter(is_checked=True).count()

    def create(self, validated_data):
        # Set user to the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class ShoppingListGenerateSerializer(serializers.Serializer):
    """Serializer for generating a shopping list from meal plans"""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    name = serializers.CharField(max_length=200, required=False)
    include_custom_items = serializers.BooleanField(default=False)
    custom_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError({
                'end_date': 'End date must be after or equal to start date.'
            })

        # Auto-generate name if not provided
        if not attrs.get('name'):
            start = attrs['start_date'].strftime('%b %d')
            end = attrs['end_date'].strftime('%b %d, %Y')
            attrs['name'] = f"Shopping List: {start} - {end}"

        return attrs
