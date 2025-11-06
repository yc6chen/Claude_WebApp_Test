import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeSelectorModal from './RecipeSelectorModal';
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api');

const mockRecipes = [
  {
    id: 1,
    name: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    category: 'dinner',
    difficulty: 'easy',
    prep_time: 15,
    cook_time: 20,
    dietary_tags: ['vegetarian']
  },
  {
    id: 2,
    name: 'Chicken Stir Fry',
    description: 'Quick and healthy stir fry',
    category: 'dinner',
    difficulty: 'medium',
    prep_time: 10,
    cook_time: 15,
    dietary_tags: ['gluten_free']
  }
];

describe('RecipeSelectorModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getRecipes.mockResolvedValue(mockRecipes);
  });

  it('does not render when closed', () => {
    render(
      <RecipeSelectorModal
        open={false}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText('Select a Recipe')).not.toBeInTheDocument();
  });

  it('renders modal when open', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    });
  });

  it('loads and displays recipes', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    });
  });

  it('displays recipe details', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Check for category and difficulty chips (both recipes are dinner, so use getAllByText)
    expect(screen.getAllByText('dinner').length).toBeGreaterThan(0);
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();

    // Check for prep time
    expect(screen.getByText(/Prep: 15 min/)).toBeInTheDocument();
    expect(screen.getByText(/Cook: 20 min/)).toBeInTheDocument();
  });

  it('searches recipes when typing in search box', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search recipes...');
    fireEvent.change(searchInput, { target: { value: 'Pasta' } });

    // Wait for debounced search (300ms)
    await waitFor(() => {
      expect(apiService.getRecipes).toHaveBeenCalledWith({ search: 'Pasta' });
    }, { timeout: 500 });
  });

  it('selects a recipe when clicked', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Click on the recipe (MUI ListItemButton is a div with role="button")
    const recipeElement = screen.getByText('Pasta Carbonara').closest('[role="button"]');
    if (recipeElement) {
      fireEvent.click(recipeElement);
    }

    // Verify recipe is selected
    await waitFor(() => {
      const addButton = screen.getByText('Add to Meal Plan');
      expect(addButton).not.toBeDisabled();
    });
  });

  it('calls onSelect when confirming selection', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Select recipe (MUI ListItemButton is a div with role="button")
    const recipeElement = screen.getByText('Pasta Carbonara').closest('[role="button"]');
    if (recipeElement) {
      fireEvent.click(recipeElement);
    }

    // Click Add to Meal Plan
    await waitFor(() => {
      const addButton = screen.getByText('Add to Meal Plan');
      expect(addButton).not.toBeDisabled();
      fireEvent.click(addButton);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables Add button when no recipe is selected', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add to Meal Plan');
    expect(addButton).toBeDisabled();
  });

  it('shows loading state while fetching recipes', () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no recipes are found', async () => {
    apiService.getRecipes.mockResolvedValue([]);

    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No recipes available')).toBeInTheDocument();
    });
  });

  it('displays dietary tags', async () => {
    render(
      <RecipeSelectorModal
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    expect(screen.getByText('vegetarian')).toBeInTheDocument();
    expect(screen.getByText(/gluten.free/i)).toBeInTheDocument();
  });
});
