/**
 * Improved tests for AddRecipeModal component
 *
 * Following React Testing Library best practices:
 * - User-centric testing (test behavior, not implementation)
 * - Accessible queries (getByRole, getByLabelText)
 * - Proper async handling with userEvent
 * - Testing from user's perspective
 * - Avoiding implementation details
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import AddRecipeModal from './AddRecipeModal';

describe('AddRecipeModal - User Interactions', () => {
  let user;
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  // Helper function to render modal with common props
  const renderModal = (props = {}) => {
    return render(
      <AddRecipeModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        {...props}
      />
    );
  };

  describe('When user opens the modal', () => {
    it('should display the recipe form with all required fields', () => {
      renderModal();

      // Use accessible queries - getByRole is preferred
      expect(screen.getByRole('heading', { name: /add new recipe/i })).toBeInTheDocument();

      // Form fields - use getByLabelText for form inputs
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      // MUI Select renders as button, check for Category label - may appear multiple times
      expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument();
      // MUI Select renders as button, check for Difficulty label - may appear multiple times
      expect(screen.getAllByText('Difficulty').length).toBeGreaterThan(0);
    });

    it('should display ingredient input section', () => {
      renderModal();

      expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ingredient name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/measurement/i)).toBeInTheDocument();
    });

    it('should show cancel and submit buttons', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
    });
  });

  describe('When user fills out the recipe form', () => {
    it('should allow entering a recipe name', async () => {
      renderModal();

      const nameInput = screen.getByLabelText(/recipe name/i);
      await user.type(nameInput, 'Chocolate Chip Cookies');

      expect(nameInput).toHaveValue('Chocolate Chip Cookies');
    });

    it('should allow entering a description', async () => {
      renderModal();

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Delicious homemade cookies');

      expect(descInput).toHaveValue('Delicious homemade cookies');
    });

    it('should allow selecting a category', async () => {
      renderModal();

      // Click on the MUI Select showing "Dinner" (default)
      const dinnerText = screen.getByText('Dinner');
      await user.click(dinnerText);

      // Select an option
      const dessertOption = screen.getByRole('option', { name: /desserts/i });
      await user.click(dessertOption);

      // Verify selection - "Desserts" should now appear
      await waitFor(() => {
        expect(screen.getByText('Desserts')).toBeInTheDocument();
      });
    });

    it('should allow selecting a difficulty level', async () => {
      renderModal();

      // Click on the MUI Select showing "Easy" (default)
      const easyText = screen.getByText('Easy');
      await user.click(easyText);

      const hardOption = screen.getByRole('option', { name: /hard/i });
      await user.click(hardOption);

      // Verify selection - "Hard" should now appear
      await waitFor(() => {
        expect(screen.getByText('Hard')).toBeInTheDocument();
      });
    });

    it('should allow entering prep and cook times', async () => {
      renderModal();

      const prepTimeInput = screen.getByLabelText(/prep time/i);
      const cookTimeInput = screen.getByLabelText(/cook time/i);

      await user.type(prepTimeInput, '15');
      await user.type(cookTimeInput, '30');

      expect(prepTimeInput).toHaveValue(15);
      expect(cookTimeInput).toHaveValue(30);
    });
  });

  describe('When user adds ingredients', () => {
    it('should add an ingredient when both name and measurement are provided', async () => {
      renderModal();

      // Fill in ingredient fields
      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);

      await user.type(ingredientNameInput, 'All-purpose flour');
      await user.type(measurementInput, '2 cups');

      // Click add button - find button with AddIcon
      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      // Verify ingredient appears in list
      expect(screen.getByText(/2 cups all-purpose flour/i)).toBeInTheDocument();
    });

    it('should clear ingredient inputs after adding', async () => {
      renderModal();

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);

      await user.type(ingredientNameInput, 'Sugar');
      await user.type(measurementInput, '1 cup');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      // Inputs should be cleared
      expect(ingredientNameInput).toHaveValue('');
      expect(measurementInput).toHaveValue('');
    });

    it('should add multiple ingredients in sequence', async () => {
      renderModal();

      const ingredients = [
        { name: 'Flour', measurement: '2 cups' },
        { name: 'Sugar', measurement: '1 cup' },
        { name: 'Butter', measurement: '1/2 cup' },
      ];

      const ingredientNameInput = screen.getByLabelText(/ingredient name/i);
      const measurementInput = screen.getByLabelText(/measurement/i);

      for (const ingredient of ingredients) {
        await user.type(ingredientNameInput, ingredient.name);
        await user.type(measurementInput, ingredient.measurement);

        const addButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('[data-testid="AddIcon"]')
        );
        await user.click(addButton);
      }

      // All ingredients should be visible
      expect(screen.getByText(/2 cups flour/i)).toBeInTheDocument();
      expect(screen.getByText(/1 cup sugar/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/2 cup butter/i)).toBeInTheDocument();
    });

    it('should allow removing an added ingredient', async () => {
      renderModal();

      // Add an ingredient
      await user.type(screen.getByLabelText(/ingredient name/i), 'Salt');
      await user.type(screen.getByLabelText(/measurement/i), '1 tsp');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      expect(screen.getByText(/1 tsp salt/i)).toBeInTheDocument();

      // Remove the ingredient
      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('[data-testid="DeleteIcon"]')
      );
      await user.click(deleteButtons[0]);

      // Ingredient should be removed
      await waitFor(() => {
        expect(screen.queryByText(/1 tsp salt/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('When user submits the form', () => {
    it('should call onAdd with recipe data when form is complete', async () => {
      renderModal();

      // Fill required fields
      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '10');
      await user.type(screen.getByLabelText(/cook time/i), '20');

      // Submit
      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Verify callback was called with correct data
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Recipe',
          prep_time: 10,
          cook_time: 20,
        })
      );
    });

    it('should include ingredients in the submitted data', async () => {
      renderModal();

      // Fill recipe fields
      await user.type(screen.getByLabelText(/recipe name/i), 'Cookie Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '15');
      await user.type(screen.getByLabelText(/cook time/i), '12');

      // Add ingredient
      await user.type(screen.getByLabelText(/ingredient name/i), 'Chocolate chips');
      await user.type(screen.getByLabelText(/measurement/i), '2 cups');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      await user.click(addButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cookie Recipe',
          ingredients: [
            expect.objectContaining({
              name: 'Chocolate chips',
              measurement: '2 cups',
            }),
          ],
        })
      );
    });

    it('should reset form after successful submission', async () => {
      renderModal();

      // Fill and submit
      const nameInput = screen.getByLabelText(/recipe name/i);
      await user.type(nameInput, 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time/i), '10');
      await user.type(screen.getByLabelText(/cook time/i), '20');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Form should be reset
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
      });
    });
  });

  describe('Form validation', () => {
    it('should disable submit button when required fields are empty', () => {
      renderModal();

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all required fields are filled', async () => {
      renderModal();

      await user.type(screen.getByLabelText(/recipe name/i), 'Test');
      await user.type(screen.getByLabelText(/prep time/i), '10');
      await user.type(screen.getByLabelText(/cook time/i), '20');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      expect(submitButton).toBeEnabled();
    });

    it('should keep submit button disabled if name is missing', async () => {
      renderModal();

      // Fill times but not name
      await user.type(screen.getByLabelText(/prep time/i), '10');
      await user.type(screen.getByLabelText(/cook time/i), '20');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      expect(submitButton).toBeDisabled();
    });

    it('should keep submit button disabled if prep time is missing', async () => {
      renderModal();

      await user.type(screen.getByLabelText(/recipe name/i), 'Test');
      await user.type(screen.getByLabelText(/cook time/i), '20');

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('When user closes the modal', () => {
    it('should call onClose when cancel button is clicked', async () => {
      renderModal();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset form when modal is closed and reopened', async () => {
      const { rerender } = renderModal();

      // Fill some data
      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');

      // Close modal by clicking cancel (which triggers handleClose)
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen modal
      rerender(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('');
      });
    });
  });

  describe('Modal visibility', () => {
    it('should not render modal content when closed', () => {
      render(
        <AddRecipeModal open={false} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      expect(screen.queryByRole('heading', { name: /add new recipe/i })).not.toBeInTheDocument();
    });

    it('should render modal content when open', () => {
      renderModal();

      expect(screen.getByRole('heading', { name: /add new recipe/i })).toBeInTheDocument();
    });
  });

  describe('Ingredient button states', () => {
    it('should disable add ingredient button when fields are empty', () => {
      renderModal();

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      expect(addButton).toBeDisabled();
    });

    it('should disable add ingredient button when only name is filled', async () => {
      renderModal();

      await user.type(screen.getByLabelText(/ingredient name/i), 'Flour');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      expect(addButton).toBeDisabled();
    });

    it('should disable add ingredient button when only measurement is filled', async () => {
      renderModal();

      await user.type(screen.getByLabelText(/measurement/i), '2 cups');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      expect(addButton).toBeDisabled();
    });

    it('should enable add ingredient button when both fields are filled', async () => {
      renderModal();

      await user.type(screen.getByLabelText(/ingredient name/i), 'Flour');
      await user.type(screen.getByLabelText(/measurement/i), '2 cups');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="AddIcon"]')
      );
      expect(addButton).toBeEnabled();
    });
  });
});
