from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Recipe, UserProfile, Favorite, MealPlan, ShoppingList, ShoppingListItem, Ingredient
from .serializers import (
    RecipeSerializer, UserSerializer, UserProfileSerializer,
    RegisterSerializer, FavoriteSerializer, MealPlanSerializer,
    MealPlanBulkSerializer, ShoppingListSerializer, ShoppingListItemSerializer,
    ShoppingListGenerateSerializer
)
from .permissions import IsOwnerOrReadOnly
from .utils import IngredientAggregator


class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Recipe.objects.all()

        # Filter based on authentication and privacy
        if user.is_authenticated:
            # Authenticated users see public recipes + their own private recipes
            queryset = queryset.filter(
                Q(is_private=False) | Q(owner=user)
            )
        else:
            # Unauthenticated users only see public recipes
            queryset = queryset.filter(is_private=False)

        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        # Filter by prep_time (max value)
        max_prep_time = self.request.query_params.get('max_prep_time', None)
        if max_prep_time:
            try:
                queryset = queryset.filter(prep_time__lte=int(max_prep_time))
            except ValueError:
                pass

        # Filter by cook_time (max value)
        max_cook_time = self.request.query_params.get('max_cook_time', None)
        if max_cook_time:
            try:
                queryset = queryset.filter(cook_time__lte=int(max_cook_time))
            except ValueError:
                pass

        # Filter by ingredients (include)
        include_ingredients = self.request.query_params.get('include_ingredients', None)
        if include_ingredients:
            ingredient_list = [i.strip() for i in include_ingredients.split(',') if i.strip()]
            for ingredient in ingredient_list:
                queryset = queryset.filter(ingredients__name__icontains=ingredient).distinct()

        # Filter by ingredients (exclude)
        exclude_ingredients = self.request.query_params.get('exclude_ingredients', None)
        if exclude_ingredients:
            ingredient_list = [i.strip() for i in exclude_ingredients.split(',') if i.strip()]
            for ingredient in ingredient_list:
                queryset = queryset.exclude(ingredients__name__icontains=ingredient).distinct()

        # Filter by dietary tags
        dietary_tags = self.request.query_params.get('dietary_tags', None)
        if dietary_tags:
            tag_list = [t.strip() for t in dietary_tags.split(',') if t.strip()]
            for tag in tag_list:
                queryset = queryset.filter(dietary_tags__contains=[tag])

        return queryset.distinct()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_recipes(self, request):
        """Get recipes owned by the current user"""
        queryset = Recipe.objects.filter(owner=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def favorites(self, request):
        """Get recipes favorited by the current user"""
        favorite_recipes = Recipe.objects.filter(
            favorited_by__user=request.user
        ).distinct()
        serializer = self.get_serializer(favorite_recipes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def favorite(self, request, pk=None):
        """Add recipe to favorites"""
        recipe = self.get_object()
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            recipe=recipe
        )
        if created:
            return Response({'status': 'favorited'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already favorited'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unfavorite(self, request, pk=None):
        """Remove recipe from favorites"""
        recipe = self.get_object()
        try:
            favorite = Favorite.objects.get(user=request.user, recipe=recipe)
            favorite.delete()
            return Response({'status': 'unfavorited'}, status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'status': 'not favorited'}, status=status.HTTP_404_NOT_FOUND)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(generics.GenericAPIView):
    """User logout endpoint - blacklists the refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({'status': 'Successfully logged out'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Get and update current user information"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class FavoriteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user favorites"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MealPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing meal plans"""
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = MealPlan.objects.filter(user=self.request.user)

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass

        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        # Filter by meal type
        meal_type = self.request.query_params.get('meal_type', None)
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)

        return queryset.select_related('recipe', 'user').order_by('date', 'meal_type', 'order')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def week(self, request):
        """Get meal plans for a specific week"""
        # Get start date from query params or default to current week's Sunday
        start_date_str = request.query_params.get('start_date')

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Default to current week's Sunday
            today = datetime.now().date()
            start_date = today - timedelta(days=today.weekday() + 1)  # Get Sunday

        # Calculate end date (Saturday)
        end_date = start_date + timedelta(days=6)

        # Get meal plans for the week
        meal_plans = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        )

        serializer = self.get_serializer(meal_plans, many=True)
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'meal_plans': serializer.data
        })

    @action(detail=False, methods=['post'])
    def bulk_operation(self, request):
        """Perform bulk operations on meal plans (clear, copy, repeat)"""
        serializer = MealPlanBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data['action']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data.get('end_date', start_date)
        target_start_date = serializer.validated_data.get('target_start_date')

        if action_type == 'clear':
            # Delete meal plans in the date range
            deleted_count = MealPlan.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date
            ).delete()[0]

            return Response({
                'status': 'success',
                'action': 'clear',
                'deleted_count': deleted_count
            })

        elif action_type == 'copy':
            # Copy meal plans from source date range to target date range
            source_plans = MealPlan.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date
            )

            new_plans = []
            for plan in source_plans:
                # Calculate day offset
                day_offset = (plan.date - start_date).days
                new_date = target_start_date + timedelta(days=day_offset)

                new_plans.append(MealPlan(
                    user=request.user,
                    recipe=plan.recipe,
                    date=new_date,
                    meal_type=plan.meal_type,
                    order=plan.order,
                    notes=plan.notes
                ))

            # Bulk create new meal plans
            MealPlan.objects.bulk_create(new_plans)

            return Response({
                'status': 'success',
                'action': 'copy',
                'copied_count': len(new_plans)
            })

        elif action_type == 'repeat':
            # Similar to copy but can be used for recurring patterns
            # For now, same implementation as copy
            source_plans = MealPlan.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date
            )

            new_plans = []
            for plan in source_plans:
                day_offset = (plan.date - start_date).days
                new_date = target_start_date + timedelta(days=day_offset)

                new_plans.append(MealPlan(
                    user=request.user,
                    recipe=plan.recipe,
                    date=new_date,
                    meal_type=plan.meal_type,
                    order=plan.order,
                    notes=plan.notes
                ))

            MealPlan.objects.bulk_create(new_plans)

            return Response({
                'status': 'success',
                'action': 'repeat',
                'repeated_count': len(new_plans)
            })


class ShoppingListViewSet(viewsets.ModelViewSet):
    """ViewSet for managing shopping lists"""
    serializer_class = ShoppingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ShoppingList.objects.filter(user=self.request.user)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=(is_active.lower() == 'true'))

        return queryset.prefetch_related('items').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a shopping list from meal plans"""
        serializer = ShoppingListGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        name = serializer.validated_data['name']
        include_custom_items = serializer.validated_data.get('include_custom_items', False)
        custom_items = serializer.validated_data.get('custom_items', [])

        # Get meal plans in the date range
        meal_plans = MealPlan.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date,
            recipe__isnull=False  # Only include meal plans with recipes
        ).select_related('recipe').prefetch_related('recipe__ingredients')

        # Collect all ingredients from recipes
        all_ingredients = []
        recipe_ids = set()

        for meal_plan in meal_plans:
            recipe_ids.add(meal_plan.recipe.id)
            for ingredient in meal_plan.recipe.ingredients.all():
                # Add recipe_id to ingredient for tracking
                ingredient.recipe_id = meal_plan.recipe.id
                all_ingredients.append(ingredient)

        # Aggregate ingredients
        if all_ingredients:
            aggregated = IngredientAggregator.aggregate_ingredients(all_ingredients)
        else:
            aggregated = {}

        # Create shopping list
        shopping_list = ShoppingList.objects.create(
            user=request.user,
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )

        # Create shopping list items
        items_to_create = []
        order = 0

        # Sort by category for better organization
        sorted_ingredients = sorted(
            aggregated.items(),
            key=lambda x: (x[1]['category'], x[1]['original_name'])
        )

        for ingredient_name, data in sorted_ingredients:
            items_to_create.append(ShoppingListItem(
                shopping_list=shopping_list,
                ingredient_name=data['original_name'],
                quantity=data['quantity'],
                unit=data['unit'],
                category=data['category'],
                source_recipes=data['source_recipes'],
                is_custom=False,
                order=order
            ))
            order += 1

        # Add custom items if requested
        if include_custom_items and custom_items:
            for custom_item in custom_items:
                items_to_create.append(ShoppingListItem(
                    shopping_list=shopping_list,
                    ingredient_name=custom_item.get('ingredient_name', ''),
                    quantity=Decimal(str(custom_item.get('quantity', 1))),
                    unit=custom_item.get('unit', 'piece'),
                    category=custom_item.get('category', 'other'),
                    is_custom=True,
                    order=order
                ))
                order += 1

        # Bulk create items
        ShoppingListItem.objects.bulk_create(items_to_create)

        # Return the created shopping list
        result_serializer = self.get_serializer(shopping_list)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add a custom item to the shopping list"""
        shopping_list = self.get_object()

        serializer = ShoppingListItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the item
        item = serializer.save(
            shopping_list=shopping_list,
            is_custom=True
        )

        return Response(
            ShoppingListItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def clear_checked(self, request, pk=None):
        """Remove all checked items from the shopping list"""
        shopping_list = self.get_object()

        deleted_count = shopping_list.items.filter(is_checked=True).delete()[0]

        return Response({
            'status': 'success',
            'deleted_count': deleted_count
        })


class ShoppingListItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing shopping list items"""
    serializer_class = ShoppingListItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return items from shopping lists owned by the current user
        return ShoppingListItem.objects.filter(
            shopping_list__user=self.request.user
        ).select_related('shopping_list').order_by('category', 'order', 'ingredient_name')

    @action(detail=True, methods=['post'])
    def toggle_check(self, request, pk=None):
        """Toggle the checked status of an item"""
        item = self.get_object()
        item.is_checked = not item.is_checked
        item.save()

        return Response({
            'id': item.id,
            'is_checked': item.is_checked
        })
