from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Recipe, UserProfile, Favorite
from .serializers import (
    RecipeSerializer, UserSerializer, UserProfileSerializer,
    RegisterSerializer, FavoriteSerializer
)
from .permissions import IsOwnerOrReadOnly


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
