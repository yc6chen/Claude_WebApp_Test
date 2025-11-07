/**
 * Tests for RecipeDetail component
 *
 * Tests cover:
 * - Empty state rendering
 * - Recipe display with all details
 * - Ingredient listing
 * - Delete button functionality
 * - Difficulty chip colors
 * - Category formatting
 * - Time display
 */
import React from 'react';
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import RecipeDetail from './RecipeDetail';

const mockRecipe = {
  id: 1,
  name: 'Chocolate Chip Cookies',
  description: 'Classic homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
  category: 'desserts',
  prep_time: 15,
  cook_time: 12,
  difficulty: 'easy',
  ingredients: [
    { id: 1, name: 'All-purpose flour', measurement: '2 cups', order: 1 },
    { id: 2, name: 'Butter', measurement: '1 cup', order: 2 },
    { id: 3, name: 'Sugar', measurement: '3/4 cup', order: 3 },
    { id: 4, name: 'Chocolate chips', measurement: '2 cups', order: 4 },
  ],
};

describe('RecipeDetail', () => {
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  describe('Empty State', () => {
    test('displays empty state when no recipe is selected', () => {
      render(<RecipeDetail recipe={null} onDelete={mockOnDelete} />);

      expect(screen.getByText('Select a recipe to view details')).toBeInTheDocument();
    });

    test('does not display recipe details when no recipe is selected', () => {
      render(<RecipeDetail recipe={null} onDelete={mockOnDelete} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
      expect(screen.queryByText('Ingredients')).not.toBeInTheDocument();
    });

    test('does not display delete button when no recipe is selected', () => {
      render(<RecipeDetail recipe={null} onDelete={mockOnDelete} />);

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Recipe Display', () => {
    test('displays recipe name', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByRole('heading', { name: mockRecipe.name })).toBeInTheDocument();
    });

    test('displays recipe description', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText(mockRecipe.description)).toBeInTheDocument();
    });

    test('displays description heading', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    test('displays ingredients heading', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    test('displays empty description for recipe without description', () => {
      const recipeWithoutDesc = { ...mockRecipe, description: '' };
      render(<RecipeDetail recipe={recipeWithoutDesc} onDelete={mockOnDelete} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      // The description section should exist but be empty
      const descriptionSection = screen.getByText('Description').closest('.MuiCardContent-root');
      expect(descriptionSection).toBeInTheDocument();
    });
  });

  describe('Difficulty Display', () => {
    test('displays easy difficulty with success color', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const chip = screen.getByText('Easy');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    });

    test('displays medium difficulty with warning color', () => {
      const mediumRecipe = { ...mockRecipe, difficulty: 'medium' };
      render(<RecipeDetail recipe={mediumRecipe} onDelete={mockOnDelete} />);

      const chip = screen.getByText('Medium');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
    });

    test('displays hard difficulty with error color', () => {
      const hardRecipe = { ...mockRecipe, difficulty: 'hard' };
      render(<RecipeDetail recipe={hardRecipe} onDelete={mockOnDelete} />);

      const chip = screen.getByText('Hard');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    });

    test('capitalizes difficulty label', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.queryByText('easy')).not.toBeInTheDocument();
    });
  });

  describe('Category Display', () => {
    test('displays category with proper formatting', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Desserts')).toBeInTheDocument();
    });

    test('formats category with underscores correctly', () => {
      const recipe = { ...mockRecipe, category: 'baking_bread' };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Baking Bread')).toBeInTheDocument();
    });

    test('capitalizes each word in category', () => {
      const recipe = { ...mockRecipe, category: 'international' };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('International')).toBeInTheDocument();
    });

    test('defaults to "Dinner" when category is missing', () => {
      const recipe = { ...mockRecipe, category: null };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Dinner')).toBeInTheDocument();
    });
  });

  describe('Time Display', () => {
    test('displays prep time', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Prep: 15 min')).toBeInTheDocument();
    });

    test('displays cook time', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Cook: 12 min')).toBeInTheDocument();
    });

    test('displays zero prep time', () => {
      const recipe = { ...mockRecipe, prep_time: 0 };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Prep: 0 min')).toBeInTheDocument();
    });

    test('displays zero cook time', () => {
      const recipe = { ...mockRecipe, cook_time: 0 };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Cook: 0 min')).toBeInTheDocument();
    });

    test('displays large time values correctly', () => {
      const recipe = { ...mockRecipe, prep_time: 120, cook_time: 240 };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('Prep: 120 min')).toBeInTheDocument();
      expect(screen.getByText('Cook: 240 min')).toBeInTheDocument();
    });
  });

  describe('Ingredient Display', () => {
    test('displays all ingredient names', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('All-purpose flour')).toBeInTheDocument();
      expect(screen.getByText('Butter')).toBeInTheDocument();
      expect(screen.getByText('Sugar')).toBeInTheDocument();
      expect(screen.getByText('Chocolate chips')).toBeInTheDocument();
    });

    test('displays all ingredient measurements', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      // Note: '2 cups' appears twice (flour and chocolate chips), so use getAllByText
      const twoCupsElements = screen.getAllByText('2 cups');
      expect(twoCupsElements).toHaveLength(2);

      expect(screen.getByText('1 cup')).toBeInTheDocument();
      expect(screen.getByText('3/4 cup')).toBeInTheDocument();
    });

    test('displays ingredients in order', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const ingredientElements = screen.getAllByRole('listitem');
      const ingredientTexts = ingredientElements.map(el => el.textContent);

      expect(ingredientTexts[0]).toContain('All-purpose flour');
      expect(ingredientTexts[1]).toContain('Butter');
      expect(ingredientTexts[2]).toContain('Sugar');
      expect(ingredientTexts[3]).toContain('Chocolate chips');
    });

    test('displays message when recipe has no ingredients', () => {
      const recipeWithoutIngredients = { ...mockRecipe, ingredients: [] };
      render(<RecipeDetail recipe={recipeWithoutIngredients} onDelete={mockOnDelete} />);

      expect(screen.getByText('No ingredients listed')).toBeInTheDocument();
    });

    test('handles recipe with undefined ingredients', () => {
      const recipeWithoutIngredients = { ...mockRecipe, ingredients: undefined };
      render(<RecipeDetail recipe={recipeWithoutIngredients} onDelete={mockOnDelete} />);

      expect(screen.getByText('No ingredients listed')).toBeInTheDocument();
    });

    test('displays single ingredient correctly', () => {
      const recipeWithOneIngredient = {
        ...mockRecipe,
        ingredients: [{ id: 1, name: 'Water', measurement: '1 cup', order: 1 }],
      };
      render(<RecipeDetail recipe={recipeWithOneIngredient} onDelete={mockOnDelete} />);

      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('1 cup')).toBeInTheDocument();
      expect(screen.queryByText('No ingredients listed')).not.toBeInTheDocument();
    });

    test('renders dividers between ingredients', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      // Should have 3 dividers for 4 ingredients (n-1 dividers)
      const dividers = document.querySelectorAll('.MuiDivider-root');
      // Filter to only li elements (the component-level dividers)
      const ingredientDividers = Array.from(dividers).filter(d => d.tagName === 'LI');
      expect(ingredientDividers.length).toBe(3);
    });
  });

  describe('Delete Functionality', () => {
    test('displays delete button', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    test('calls onDelete with recipe id when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockRecipe.id);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    test('delete button has error color', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveClass('MuiIconButton-colorError');
    });
  });

  describe('Layout and Structure', () => {
    test('renders description card', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const descriptionHeading = screen.getByText('Description');
      const card = descriptionHeading.closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders ingredients card', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const ingredientsHeading = screen.getByText('Ingredients');
      const card = ingredientsHeading.closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders all chips in header', () => {
      render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);

      const chips = document.querySelectorAll('.MuiChip-root');
      expect(chips.length).toBe(4); // difficulty, category, prep time, cook time
    });
  });

  describe('Edge Cases', () => {
    test('handles recipe with very long name', () => {
      const recipe = {
        ...mockRecipe,
        name: 'This is a very long recipe name that should still be displayed correctly without breaking the layout',
      };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText(recipe.name)).toBeInTheDocument();
    });

    test('handles recipe with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const recipe = { ...mockRecipe, description: longDescription };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    test('handles recipe with special characters in name', () => {
      const recipe = { ...mockRecipe, name: "Mom's Special Recipe & Dad's Favorite!" };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText(recipe.name)).toBeInTheDocument();
    });

    test('handles ingredient with special measurement format', () => {
      const recipe = {
        ...mockRecipe,
        ingredients: [
          { id: 1, name: 'Salt', measurement: '1/2 tsp', order: 1 },
          { id: 2, name: 'Pepper', measurement: 'a pinch', order: 2 },
        ],
      };
      render(<RecipeDetail recipe={recipe} onDelete={mockOnDelete} />);

      expect(screen.getByText('1/2 tsp')).toBeInTheDocument();
      expect(screen.getByText('a pinch')).toBeInTheDocument();
    });

    test('handles switching between recipes', () => {
      const recipe1 = mockRecipe;
      const recipe2 = {
        ...mockRecipe,
        id: 2,
        name: 'Pancakes',
        description: 'Fluffy pancakes',
        ingredients: [{ id: 5, name: 'Milk', measurement: '1 cup', order: 1 }],
      };

      const { rerender } = render(<RecipeDetail recipe={recipe1} onDelete={mockOnDelete} />);
      expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument();

      rerender(<RecipeDetail recipe={recipe2} onDelete={mockOnDelete} />);
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
      expect(screen.queryByText('Chocolate Chip Cookies')).not.toBeInTheDocument();
    });

    test('handles transition from recipe to empty state', () => {
      const { rerender } = render(<RecipeDetail recipe={mockRecipe} onDelete={mockOnDelete} />);
      expect(screen.getByText(mockRecipe.name)).toBeInTheDocument();

      rerender(<RecipeDetail recipe={null} onDelete={mockOnDelete} />);
      expect(screen.getByText('Select a recipe to view details')).toBeInTheDocument();
      expect(screen.queryByText(mockRecipe.name)).not.toBeInTheDocument();
    });
  });
});
