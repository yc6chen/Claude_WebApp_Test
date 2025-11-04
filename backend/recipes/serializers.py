from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Recipe, Ingredient, UserProfile, Favorite


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
