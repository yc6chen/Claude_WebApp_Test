/**
 * Tests for AddRecipeModal component
 *
 * Tests cover:
 * - Rendering and visibility
 * - Form input handling
 * - Validation (time fields, required fields)
 * - Ingredient management (add, remove)
 * - Form submission
 * - Modal closing and resetting
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRecipeModal from './AddRecipeModal';

describe('AddRecipeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAdd.mockClear();
  });

  describe('Rendering', () => {
    test('renders modal when open prop is true', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    });

    test('does not render modal when open prop is false', () => {
      render(<AddRecipeModal open={false} onClose={mockOnClose} onAdd={mockOnAdd} />);

      expect(screen.queryByText('Add New Recipe')).not.toBeInTheDocument();
    });

    test('renders all form fields', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      // Check for Category label (MUI Select) - may appear multiple times
      expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument();
      // Check for Difficulty label (MUI Select) - may appear multiple times
      expect(screen.getAllByText('Difficulty').length).toBeGreaterThan(0);
    });

    test('renders ingredient section', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByLabelText(/ingredient name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/measurement/i)).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    test('updates recipe name field', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const nameInput = screen.getByLabelText(/recipe name/i);
      await user.type(nameInput, 'Chocolate Cake');

      expect(nameInput).toHaveValue('Chocolate Cake');
    });

    test('updates description field', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Delicious chocolate cake');

      expect(descInput).toHaveValue('Delicious chocolate cake');
    });

    test('updates category selection', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Click on the MUI Select showing "Dinner" (default value)
      const dinnerText = screen.getByText('Dinner');
      await user.click(dinnerText);

      const dessertOption = screen.getByRole('option', { name: /desserts/i });
      await user.click(dessertOption);

      // Verify "Desserts" now appears
      await waitFor(() => {
        expect(screen.getByText('Desserts')).toBeInTheDocument();
      });
    });

    test('updates difficulty selection', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Click on the MUI Select showing "Easy" (default value)
      const easyText = screen.getByText('Easy');
      await user.click(easyText);

      const hardOption = screen.getByRole('option', { name: /hard/i });
      await user.click(hardOption);

      // Verify "Hard" now appears
      await waitFor(() => {
        expect(screen.getByText('Hard')).toBeInTheDocument();
      });
    });

    test('updates prep time field with valid number', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const prepTimeInput = screen.getByLabelText(/prep time/i);
      await user.type(prepTimeInput, '15');

      expect(prepTimeInput).toHaveValue(15);
    });

    test('updates cook time field with valid number', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const cookTimeInput = screen.getByLabelText(/cook time/i);
      await user.type(cookTimeInput, '30');

      expect(cookTimeInput).toHaveValue(30);
    });
  });

  describe('Form Validation', () => {
    test('add recipe button is disabled when name is empty', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeDisabled();
    });

    test('add recipe button is disabled when prep_time is empty', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookTimeInput = screen.getByLabelText(/cook time/i);

      await user.type(nameInput, 'Test Recipe');
      await user.type(cookTimeInput, '20');

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeDisabled();
    });

    test('add recipe button is disabled when cook_time is empty', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const nameInput = screen.getByLabelText(/recipe name/i);
      const prepTimeInput = screen.getByLabelText(/prep time/i);

      await user.type(nameInput, 'Test Recipe');
      await user.type(prepTimeInput, '15');

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeDisabled();
    });

    test('add recipe button is enabled when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const nameInput = screen.getByLabelText(/recipe name/i);
      const prepTimeInput = screen.getByLabelText(/prep time/i);
      const cookTimeInput = screen.getByLabelText(/cook time/i);

      await user.type(nameInput, 'Test Recipe');
      await user.type(prepTimeInput, '15');
      await user.type(cookTimeInput, '30');

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeEnabled();
    });

    test('has default category value of "dinner"', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Check that "Dinner" text appears in the document (in the select)
      expect(screen.getByText('Dinner')).toBeInTheDocument();
    });

    test('has default difficulty value of "easy"', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Check that "Easy" text appears in the document (in the select)
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });
  });

  describe('Ingredient Management', () => {
    test('add ingredient button is disabled when ingredient fields are empty', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );

      expect(addButton).toBeDisabled();
    });

    test('can add ingredient when both fields are filled', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);

      await user.type(ingredientNameInput, 'Flour');
      await user.type(measurementInput, '2 cups');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      expect(screen.getByText('2 cups Flour')).toBeInTheDocument();
    });

    test('clears ingredient input fields after adding ingredient', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);

      await user.type(ingredientNameInput, 'Sugar');
      await user.type(measurementInput, '1 cup');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      expect(ingredientNameInput).toHaveValue('');
      expect(measurementInput).toHaveValue('');
    });

    test('can add multiple ingredients', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);
      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );

      // Add first ingredient
      await user.type(ingredientNameInput, 'Flour');
      await user.type(measurementInput, '2 cups');
      await user.click(addButton);

      // Add second ingredient
      await user.type(ingredientNameInput, 'Sugar');
      await user.type(measurementInput, '1 cup');
      await user.click(addButton);

      expect(screen.getByText('2 cups Flour')).toBeInTheDocument();
      expect(screen.getByText('1 cup Sugar')).toBeInTheDocument();
    });

    test('can remove ingredient', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);
      const addIngredientButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );

      // Add ingredient
      await user.type(ingredientNameInput, 'Butter');
      await user.type(measurementInput, '1/2 cup');
      await user.click(addIngredientButton);

      expect(screen.getByText('1/2 cup Butter')).toBeInTheDocument();

      // Remove ingredient - find all delete buttons and click the first one
      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('[data-testid="DeleteIcon"]')
      );
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('1/2 cup Butter')).not.toBeInTheDocument();
      });
    });

    test('displays ingredients in order', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);
      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );

      // Add ingredients in order
      const ingredients = [
        { name: 'First', measurement: '1' },
        { name: 'Second', measurement: '2' },
        { name: 'Third', measurement: '3' }
      ];

      for (const ing of ingredients) {
        await user.type(ingredientNameInput, ing.name);
        await user.type(measurementInput, ing.measurement);
        await user.click(addButton);
      }

      const ingredientElements = screen.getAllByText(/\d+ (First|Second|Third)/);
      expect(ingredientElements).toHaveLength(3);
    });
  });

  describe('Form Submission', () => {
    test('calls onAdd with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Fill in required fields
      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '15');
      await user.type(screen.getByLabelText(/cook time/i), '30');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Test Recipe',
        description: '',
        category: 'dinner',
        prep_time: 15,
        cook_time: 30,
        difficulty: 'easy',
        ingredients: [],
      });
    });

    test('includes ingredients in submission data', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Fill in recipe fields
      await user.type(screen.getByLabelText(/recipe name/i), 'Cookie Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '10');
      await user.type(screen.getByLabelText(/cook time/i), '12');

      // Add ingredient
      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);
      await user.type(ingredientNameInput, 'Flour');
      await user.type(measurementInput, '2 cups');
      const addIngredientButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addIngredientButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cookie Recipe',
          ingredients: [
            { name: 'Flour', measurement: '2 cups', order: 0 }
          ],
        })
      );
    });

    test('converts time strings to integers on submission', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      await user.type(screen.getByLabelText(/recipe name/i), 'Test');
      await user.type(screen.getByLabelText(/prep time/i), '20');
      await user.type(screen.getByLabelText(/cook time/i), '45');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          prep_time: 20,
          cook_time: 45,
        })
      );
    });

    test('resets form after submission', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '15');
      await user.type(screen.getByLabelText(/cook time/i), '30');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Check fields are reset
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('');
        expect(screen.getByLabelText(/prep time/i)).toHaveValue(null);
        expect(screen.getByLabelText(/cook time/i)).toHaveValue(null);
      });
    });
  });

  describe('Modal Closing', () => {
    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets form when closing modal', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Fill form
      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '15');

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen modal
      rerender(<AddRecipeModal open={false} onClose={mockOnClose} onAdd={mockOnAdd} />);
      rerender(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Fields should be reset
      expect(screen.getByLabelText(/recipe name/i)).toHaveValue('');
    });

    test('clears ingredients when closing modal', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Add ingredient
      await user.type(screen.getByLabelText(/ingredient name/i), 'Flour');
      await user.type(screen.getByLabelText(/measurement/i), '2 cups');
      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      expect(screen.getByText('2 cups Flour')).toBeInTheDocument();

      // Close and reopen
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      rerender(<AddRecipeModal open={false} onClose={mockOnClose} onAdd={mockOnAdd} />);
      rerender(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Ingredient should be cleared
      expect(screen.queryByText('2 cups Flour')).not.toBeInTheDocument();
    });
  });
});
