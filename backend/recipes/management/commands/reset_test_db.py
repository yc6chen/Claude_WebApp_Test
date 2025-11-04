from django.core.management.base import BaseCommand
from recipes.models import Recipe, Ingredient


class Command(BaseCommand):
    help = 'Reset test database by deleting all recipes and ingredients'

    def handle(self, *args, **options):
        # Delete all recipes (cascade will handle ingredients)
        recipe_count = Recipe.objects.count()
        ingredient_count = Ingredient.objects.count()

        Recipe.objects.all().delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {recipe_count} recipes and {ingredient_count} ingredients'
            )
        )
