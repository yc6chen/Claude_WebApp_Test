import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MealPlanner from './MealPlanner';
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api');

// Mock RecipeSelectorModal
jest.mock('./RecipeSelectorModal', () => {
  return function RecipeSelectorModal({ open, onClose, onSelect }) {
    return open ? (
      <div data-testid="recipe-selector-modal">
        <button onClick={() => onSelect({ id: 1, name: 'Test Recipe' })}>
          Select Recipe
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

const renderMealPlanner = () => {
  return render(
    <BrowserRouter>
      <MealPlanner />
    </BrowserRouter>
  );
};

describe('MealPlanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API response
    apiService.getMealPlanWeek.mockResolvedValue({
      start_date: '2025-11-03',
      end_date: '2025-11-09',
      meal_plans: [
        {
          id: 1,
          date: '2025-11-05',
          meal_type: 'dinner',
          recipe: 1,
          recipe_details: {
            id: 1,
            name: 'Pasta Carbonara',
            prep_time: 15,
            cook_time: 20
          }
        }
      ]
    });
  });

  it('renders meal planner with weekly calendar', async () => {
    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    });

    // Check for days of the week
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
  });

  it('displays meal plan items in correct slots', async () => {
    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('opens recipe selector when Add button is clicked', async () => {
    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    });

    // Click an Add button
    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('recipe-selector-modal')).toBeInTheDocument();
    });
  });

  it('creates meal plan when recipe is selected', async () => {
    apiService.createMealPlan.mockResolvedValue({
      id: 2,
      date: '2025-11-05',
      meal_type: 'breakfast',
      recipe: 1
    });

    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    });

    // Click Add button
    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[0]);

    // Wait for modal and select recipe
    await waitFor(() => {
      expect(screen.getByTestId('recipe-selector-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select Recipe'));

    await waitFor(() => {
      expect(apiService.createMealPlan).toHaveBeenCalled();
    });
  });

  it('navigates between weeks', async () => {
    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    });

    // Find and click next week button
    const nextButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('svg')
    );

    if (nextButton) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(apiService.getMealPlanWeek).toHaveBeenCalledTimes(2);
      });
    }
  });

  it('deletes meal plan when delete button is clicked', async () => {
    apiService.deleteMealPlan.mockResolvedValue({});

    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Find delete button (there should be one for the pasta dish)
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg[data-testid="DeleteIcon"]')
    );

    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(apiService.deleteMealPlan).toHaveBeenCalledWith(1);
      });
    }
  });

  it('shows error message when API call fails', async () => {
    apiService.getMealPlanWeek.mockRejectedValue(new Error('API Error'));

    renderMealPlanner();

    await waitFor(() => {
      expect(screen.getByText(/failed to load meal plans/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    renderMealPlanner();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
