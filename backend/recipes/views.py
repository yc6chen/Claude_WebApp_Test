from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Recipe
from .serializers import RecipeSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Recipe.objects.all()

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
