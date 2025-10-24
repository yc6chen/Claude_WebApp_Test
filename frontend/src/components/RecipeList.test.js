/**
 * Tests for RecipeList component
 *
 * Tests cover:
 * - Rendering with empty and populated recipe lists
 * - Recipe grouping by category
 * - Category ordering
 * - Recipe selection
 * - Recipe count display
 * - Difficulty chip colors
 * - Total time calculation
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeList from './RecipeList';

const mockRecipes = [
  {
    id: 1,
    name: 'Pancakes',
    category: 'breakfast',
    difficulty: 'easy',
    prep_time: 10,
    cook_time: 15,
  },
  {
    id: 2,
    name: 'Spaghetti Carbonara',
    category: 'dinner',
    difficulty: 'medium',
    prep_time: 15,
    cook_time: 20,
  },
  {
    id: 3,
    name: 'Chocolate Cake',
    category: 'desserts',
    difficulty: 'hard',
    prep_time: 30,
    cook_time: 45,
  },
  {
    id: 4,
    name: 'Omelette',
    category: 'breakfast',
    difficulty: 'easy',
    prep_time: 5,
    cook_time: 10,
  },
];

describe('RecipeList', () => {
  const mockOnSelectRecipe = jest.fn();

  beforeEach(() => {
    mockOnSelectRecipe.mockClear();
  });

  describe('Rendering', () => {
    test('renders component with heading', () => {
      render(<RecipeList recipes={[]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });

    test('displays recipe count with single recipe', () => {
      const singleRecipe = [mockRecipes[0]];
      render(<RecipeList recipes={singleRecipe} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('1 recipe')).toBeInTheDocument();
    });

    test('displays recipe count with multiple recipes', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('4 recipes')).toBeInTheDocument();
    });

    test('displays recipe count as zero when empty', () => {
      render(<RecipeList recipes={[]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('0 recipes')).toBeInTheDocument();
    });

    test('renders all recipe names', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Pancakes')).toBeInTheDocument();
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.getByText('Omelette')).toBeInTheDocument();
    });
  });

  describe('Category Grouping', () => {
    test('groups recipes by category', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Breakfast (2)')).toBeInTheDocument();
      expect(screen.getByText('Dinner (1)')).toBeInTheDocument();
      expect(screen.getByText('Desserts (1)')).toBeInTheDocument();
    });

    test('displays category count correctly', () => {
      const breakfastRecipes = mockRecipes.filter(r => r.category === 'breakfast');
      render(<RecipeList recipes={breakfastRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Breakfast (2)')).toBeInTheDocument();
    });

    test('does not display empty categories', () => {
      const breakfastRecipes = mockRecipes.filter(r => r.category === 'breakfast');
      render(<RecipeList recipes={breakfastRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.queryByText(/Dinner/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Desserts/)).not.toBeInTheDocument();
    });

    test('handles recipes with missing category (defaults to dinner)', () => {
      const recipeWithoutCategory = { ...mockRecipes[0], category: undefined };
      render(<RecipeList recipes={[recipeWithoutCategory]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Dinner (1)')).toBeInTheDocument();
    });

    test('displays all category names correctly', () => {
      const allCategoryRecipes = [
        { id: 1, name: 'Recipe 1', category: 'appetizers', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 2, name: 'Recipe 2', category: 'baking_bread', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 3, name: 'Recipe 3', category: 'breakfast', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 4, name: 'Recipe 4', category: 'desserts', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 5, name: 'Recipe 5', category: 'dinner', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 6, name: 'Recipe 6', category: 'drinks', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 7, name: 'Recipe 7', category: 'international', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 8, name: 'Recipe 8', category: 'lunch', difficulty: 'easy', prep_time: 10, cook_time: 10 },
      ];

      render(<RecipeList recipes={allCategoryRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Appetizers (1)')).toBeInTheDocument();
      expect(screen.getByText('Baking and Bread (1)')).toBeInTheDocument();
      expect(screen.getByText('Breakfast (1)')).toBeInTheDocument();
      expect(screen.getByText('Desserts (1)')).toBeInTheDocument();
      expect(screen.getByText('Dinner (1)')).toBeInTheDocument();
      expect(screen.getByText('Drinks (1)')).toBeInTheDocument();
      expect(screen.getByText('International (1)')).toBeInTheDocument();
      expect(screen.getByText('Lunch (1)')).toBeInTheDocument();
    });
  });

  describe('Category Ordering', () => {
    test('displays categories in correct order', () => {
      const allCategoryRecipes = [
        { id: 1, name: 'Recipe 1', category: 'international', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 2, name: 'Recipe 2', category: 'breakfast', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 3, name: 'Recipe 3', category: 'dinner', difficulty: 'easy', prep_time: 10, cook_time: 10 },
      ];

      render(<RecipeList recipes={allCategoryRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const categoryHeaders = screen.getAllByRole('list').map(list =>
        list.querySelector('[class*="MuiListSubheader"]')?.textContent
      ).filter(Boolean);

      // Expected order: breakfast, lunch, dinner, appetizers, desserts, drinks, baking_bread, international
      expect(categoryHeaders[0]).toMatch(/Breakfast/);
      expect(categoryHeaders[1]).toMatch(/Dinner/);
      expect(categoryHeaders[2]).toMatch(/International/);
    });
  });

  describe('Recipe Selection', () => {
    test('calls onSelectRecipe when recipe is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      // Find by role button with accessible name
      const pancakesButton = screen.getByRole('button', { name: /pancakes/i });
      await user.click(pancakesButton);

      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
    });

    test('calls onSelectRecipe with correct recipe data', async () => {
      const user = userEvent.setup();
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const cakeButton = screen.getByRole('button', { name: /chocolate cake/i });
      await user.click(cakeButton);

      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[2]);
    });

    test('highlights selected recipe', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          selectedRecipe={mockRecipes[0]}
          onSelectRecipe={mockOnSelectRecipe}
        />
      );

      const pancakesButton = screen.getByRole('button', { name: /pancakes/i });
      expect(pancakesButton).toHaveClass('Mui-selected');
    });

    test('does not highlight unselected recipes', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          selectedRecipe={mockRecipes[0]}
          onSelectRecipe={mockOnSelectRecipe}
        />
      );

      const spaghettiButton = screen.getByRole('button', { name: /spaghetti carbonara/i });
      expect(spaghettiButton).not.toHaveClass('Mui-selected');
    });

    test('allows selecting different recipe', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <RecipeList
          recipes={mockRecipes}
          selectedRecipe={mockRecipes[0]}
          onSelectRecipe={mockOnSelectRecipe}
        />
      );

      // Initially Pancakes is selected
      expect(screen.getByRole('button', { name: /pancakes/i })).toHaveClass('Mui-selected');

      // Click on different recipe
      const cakeButton = screen.getByRole('button', { name: /chocolate cake/i });
      await user.click(cakeButton);

      expect(mockOnSelectRecipe).toHaveBeenCalledWith(mockRecipes[2]);

      // Update with new selection
      rerender(
        <RecipeList
          recipes={mockRecipes}
          selectedRecipe={mockRecipes[2]}
          onSelectRecipe={mockOnSelectRecipe}
        />
      );

      expect(screen.getByRole('button', { name: /chocolate cake/i })).toHaveClass('Mui-selected');
      expect(screen.getByRole('button', { name: /pancakes/i })).not.toHaveClass('Mui-selected');
    });
  });

  describe('Difficulty Display', () => {
    test('displays difficulty chip for each recipe', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getAllByText('easy')).toHaveLength(2);
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('hard')).toBeInTheDocument();
    });

    test('displays easy difficulty with success color', () => {
      render(<RecipeList recipes={[mockRecipes[0]]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const chip = screen.getByText('easy').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    test('displays medium difficulty with warning color', () => {
      render(<RecipeList recipes={[mockRecipes[1]]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const chip = screen.getByText('medium').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    test('displays hard difficulty with error color', () => {
      render(<RecipeList recipes={[mockRecipes[2]]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const chip = screen.getByText('hard').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorError');
    });
  });

  describe('Total Time Display', () => {
    test('displays total time for each recipe', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('25 min total')).toBeInTheDocument(); // Pancakes: 10+15
      expect(screen.getByText('35 min total')).toBeInTheDocument(); // Spaghetti: 15+20
      expect(screen.getByText('75 min total')).toBeInTheDocument(); // Cake: 30+45
      expect(screen.getByText('15 min total')).toBeInTheDocument(); // Omelette: 5+10
    });

    test('calculates total time correctly', () => {
      const recipe = {
        id: 1,
        name: 'Test Recipe',
        category: 'dinner',
        difficulty: 'easy',
        prep_time: 20,
        cook_time: 40,
      };

      render(<RecipeList recipes={[recipe]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('60 min total')).toBeInTheDocument();
    });

    test('handles zero time values', () => {
      const recipe = {
        id: 1,
        name: 'Quick Recipe',
        category: 'dinner',
        difficulty: 'easy',
        prep_time: 0,
        cook_time: 5,
      };

      render(<RecipeList recipes={[recipe]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('5 min total')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty recipe list', () => {
      render(<RecipeList recipes={[]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Recipes')).toBeInTheDocument();
      expect(screen.getByText('0 recipes')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('handles null selectedRecipe', () => {
      render(<RecipeList recipes={mockRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('Mui-selected');
      });
    });

    test('handles recipe without difficulty', () => {
      const recipeWithoutDifficulty = {
        id: 1,
        name: 'Test',
        category: 'dinner',
        prep_time: 10,
        cook_time: 10,
      };

      render(<RecipeList recipes={[recipeWithoutDifficulty]} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    test('handles multiple recipes in same category', () => {
      const dinnerRecipes = [
        { id: 1, name: 'Dinner 1', category: 'dinner', difficulty: 'easy', prep_time: 10, cook_time: 10 },
        { id: 2, name: 'Dinner 2', category: 'dinner', difficulty: 'medium', prep_time: 20, cook_time: 20 },
        { id: 3, name: 'Dinner 3', category: 'dinner', difficulty: 'hard', prep_time: 30, cook_time: 30 },
      ];

      render(<RecipeList recipes={dinnerRecipes} selectedRecipe={null} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('Dinner (3)')).toBeInTheDocument();
      expect(screen.getByText('Dinner 1')).toBeInTheDocument();
      expect(screen.getByText('Dinner 2')).toBeInTheDocument();
      expect(screen.getByText('Dinner 3')).toBeInTheDocument();
    });
  });
});
