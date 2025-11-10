import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ShoppingList from './ShoppingList';
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api');

const mockShoppingList = {
  id: 1,
  name: 'Weekly Shopping List',
  start_date: '2025-11-03',
  end_date: '2025-11-09',
  is_active: true,
  items: [
    {
      id: 1,
      ingredient_name: 'Milk',
      quantity: '1',
      unit: 'gallon',
      category: 'dairy',
      category_display: 'Dairy & Eggs',
      is_checked: false,
      is_custom: false,
      source_recipes: [1, 2],
      notes: ''
    },
    {
      id: 2,
      ingredient_name: 'Bread',
      quantity: '2',
      unit: 'loaves',
      category: 'bakery',
      category_display: 'Bakery',
      is_checked: true,
      is_custom: true,
      notes: 'Whole wheat'
    }
  ]
};

const renderShoppingList = (id = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/shopping-lists/${id}`]}>
      <Routes>
        <Route path="/shopping-lists/:id" element={<ShoppingList />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ShoppingList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getShoppingList.mockResolvedValue(mockShoppingList);
  });

  it('renders shopping list with items', async () => {
    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping List')).toBeInTheDocument();
    });

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
  });

  it('displays progress indicator', async () => {
    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument(); // 1 checked, 2 total
    });
  });

  it('toggles item checked status', async () => {
    apiService.toggleShoppingListItemCheck.mockResolvedValue({
      id: 1,
      is_checked: true
    });

    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    // Find and click checkbox for Milk
    const checkboxes = screen.getAllByRole('checkbox');
    const milkCheckbox = checkboxes[0]; // First unchecked item

    fireEvent.click(milkCheckbox);

    await waitFor(() => {
      expect(apiService.toggleShoppingListItemCheck).toHaveBeenCalledWith(1);
    });
  });

  it('opens add item dialog', async () => {
    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping List')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add Custom Item')).toBeInTheDocument();
    });
  });

  it('adds custom item to shopping list', async () => {
    apiService.addItemToShoppingList.mockResolvedValue({
      id: 3,
      ingredient_name: 'Eggs',
      quantity: '12',
      unit: 'pieces',
      category: 'dairy',
      is_checked: false,
      is_custom: true
    });

    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping List')).toBeInTheDocument();
    });

    // Open add dialog
    fireEvent.click(screen.getByText('Add Item'));

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Add Custom Item')).toBeInTheDocument();
    });

    // Fill form using placeholder/label text
    const ingredientInput = screen.getByLabelText(/ingredient name/i);
    const quantityInput = screen.getByLabelText(/quantity/i);
    const unitInput = screen.getByLabelText(/unit/i);

    fireEvent.change(ingredientInput, {
      target: { value: 'Eggs' }
    });
    fireEvent.change(quantityInput, {
      target: { value: '12' }
    });
    fireEvent.change(unitInput, {
      target: { value: 'pieces' }
    });

    // Submit
    const addButtons = screen.getAllByText('Add');
    const submitButton = addButtons[addButtons.length - 1]; // Last "Add" button in dialog
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.addItemToShoppingList).toHaveBeenCalled();
    });
  });

  it('deletes item from shopping list', async () => {
    apiService.deleteShoppingListItem.mockResolvedValue({});
    window.confirm = jest.fn(() => true);

    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    // Find delete buttons
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg[data-testid="DeleteIcon"]')
    );

    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(apiService.deleteShoppingListItem).toHaveBeenCalled();
      });
    }
  });

  it('displays items grouped by category', async () => {
    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText(/Dairy & Eggs/)).toBeInTheDocument();
      expect(screen.getByText(/Bakery/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderShoppingList();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when API call fails', async () => {
    apiService.getShoppingList.mockRejectedValue(new Error('API Error'));

    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText(/failed to load shopping list/i)).toBeInTheDocument();
    });
  });

  it('displays custom item badge', async () => {
    renderShoppingList();

    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    // Bread should have a "Custom" chip
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
